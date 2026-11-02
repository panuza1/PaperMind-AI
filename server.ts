import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Middleware for JSON parsing with ample size for extracted PDF text chunks
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

// Initialize Google Gemini Client (Server-side only)
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in environment.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    model: 'gemini-3.8-flash',
    timestamp: new Date().toISOString(),
  });
});

// Resilient model caller: tries gemini-3.8-flash first, falling back to gemini-3.1-flash-lite on 503 capacity spikes
async function generateWithGemini(ai: GoogleGenAI, options: {
  contents: any;
  config?: any;
}) {
  try {
    return await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: options.contents,
      config: options.config,
    });
  } catch (err: any) {
    console.warn('gemini-3.8-flash capacity spike (503/429), failing over to gemini-3.1-flash-lite');
    return await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: options.contents,
      config: options.config,
    });
  }
}

// Robust JSON parser that handles markdown fences and unescaped LaTeX backslashes (\sqrt, \alpha, \frac, etc.)
function safeParseJson(raw: string): any {
  if (!raw) return {};
  let clean = raw.trim();
  clean = clean.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '');

  try {
    return JSON.parse(clean);
  } catch {
    try {
      // Fix unescaped backslashes not followed by valid JSON escape chars
      const fixed = clean.replace(/\\(?!["\\/bfnrtu])/g, '\\\\');
      return JSON.parse(fixed);
    } catch {
      const match = clean.match(/\{[\s\S]*\}/);
      if (match) {
        const fixedMatch = match[0].replace(/\\(?!["\\/bfnrtu])/g, '\\\\');
        return JSON.parse(fixedMatch);
      }
      throw new Error('Failed to parse model JSON output');
    }
  }
}

// Helper to format page excerpts for Gemini context
function formatPaperContext(pages: Array<{ pageNumber: number; text: string }>, maxPages = 40): string {
  if (!pages || pages.length === 0) return 'No text content available.';
  const limitedPages = pages.slice(0, maxPages);
  return limitedPages
    .map(p => `--- [PAGE ${p.pageNumber}] ---\n${p.text ? p.text.trim().slice(0, 3500) : ''}`)
    .join('\n\n');
}

// 1. Summarization Endpoint
app.post('/api/summarize', async (req: Request, res: Response) => {
  try {
    const { title, authors, year, abstract, pages, language = 'en', depth = 'comprehensive' } = req.body;

    if (!pages || !Array.isArray(pages)) {
      res.status(400).json({ error: 'Pages array is required.' });
      return;
    }

    const ai = getGeminiClient();
    const formattedContext = formatPaperContext(pages);

    const langInstruction = language === 'th' 
      ? 'Output ALL explanations, findings, and analysis in academic Thai (ภาษาไทย). Keep technical and mathematical terms standard in English in parentheses where appropriate (e.g. ความสนใจแบบหลายหัว (Multi-Head Attention)).' 
      : 'Output in fluent, rigorous, academic English.';

    const systemPrompt = `You are PaperMind AI, a world-class principal research scientist and academic literature reviewer.
Your mission is to perform a thorough, evidence-grounded analysis of the provided research paper.
${langInstruction}

You must return a valid JSON object matching the exact schema specified below without any markdown fences around the JSON if possible, or standard JSON.

Schema requirements:
{
  "title": string,
  "executiveSummary": string (concise 2-3 paragraph synthesis of why this paper matters, core breakthrough, and main results),
  "problemStatement": string (the core gap, limitation in prior work, or motivation),
  "methodology": {
    "architecture": string (model or experimental architecture),
    "keyInnovations": [string],
    "trainingOrExperimentalSetup": string
  },
  "keyFindings": [
    {
      "metricOrFinding": string,
      "result": string,
      "pageReference": number or string,
      "interpretation": string
    }
  ],
  "strengths": [string],
  "limitations": [string],
  "practicalApplications": [string],
  "keywords": [string],
  "quickTakeaway": string (one powerful sentence summary)
}

Important grounding rule:
Ground every finding and claim in the actual text from the [PAGE X] tags. Provide realistic page citations.`;

    const userPrompt = `Analyze this paper:
Title: ${title || 'Untitled Research Paper'}
Authors: ${authors || 'Not specified'}
Year/Venue: ${year || 'Not specified'}
Abstract: ${abstract || 'N/A'}

Paper Text by Page:
${formattedContext}

Generate the comprehensive JSON summary now.`;

    const response = await generateWithGemini(ai, {
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
      },
    });

    const parsedData = safeParseJson(response.text || '{}');
    res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error('Error in /api/summarize:', error);
    res.status(500).json({
      error: error?.message || 'Failed to generate summary',
      details: error?.status || 'Unknown status',
    });
  }
});

// 2. Chat with PDF with Verified Page Citations
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { title, pages, history = [], query, language = 'en' } = req.body;

    if (!query) {
      res.status(400).json({ error: 'Query is required.' });
      return;
    }

    const ai = getGeminiClient();
    const formattedContext = formatPaperContext(pages || []);

    const langInstruction = language === 'th'
      ? 'Answer in academic Thai (ภาษาไทย), retaining standard scientific equations, variable names, and algorithmic concepts.'
      : 'Answer in concise, sharp, academic English.';

    const systemPrompt = `You are PaperMind AI's Paper Intelligence Engine.
You are assisting a researcher reading the paper titled: "${title || 'Uploaded Document'}".
${langInstruction}

CRITICAL CITATION RULES:
1. Ground your answers STRICTLY in the provided paper context divided into [PAGE X] blocks.
2. Whenever you state a claim, quote an insight, or mention experimental results, you MUST append a verified page citation in the exact format: [Page X] (e.g. [Page 3], or [Page 4, 7]).
3. If an answer cannot be determined or verified from the text, state honestly: "The provided paper pages do not explicitly address this." Never hallucinate or invent page numbers.
4. Also extract 1 to 4 key evidence snippets with page numbers so the user can inspect the exact passage in the paper viewer.

Format your output as a JSON object:
{
  "answer": string (markdown supported with [Page X] citation tags inline),
  "citations": [
    {
      "page": number,
      "quote": string (verbatim or near-verbatim sentence from that page),
      "relevance": string (brief note on how this supports the answer)
    }
  ],
  "suggestedFollowUps": [string] (2-3 insightful follow-up questions a researcher should ask next)
}`;

    const formattedHistory = history
      .slice(-6)
      .map((h: { role: string; content: string }) => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content}`)
      .join('\n');

    const prompt = `Paper Content:
${formattedContext}

Recent Conversation History:
${formattedHistory || 'None'}

User Question: ${query}

Respond in the required JSON format.`;

    const response = await generateWithGemini(ai, {
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
      },
    });

    const parsedData = safeParseJson(response.text || '{}');
    res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error('Error in /api/chat:', error);
    res.status(500).json({
      error: error?.message || 'Failed to process chat query',
    });
  }
});

// 3. Multi-Paper Comparison Endpoint
app.post('/api/compare', async (req: Request, res: Response) => {
  try {
    const { papers, language = 'en', focusAreas = [] } = req.body;

    if (!papers || !Array.isArray(papers) || papers.length < 2) {
      res.status(400).json({ error: 'Please provide at least 2 papers to compare.' });
      return;
    }

    const ai = getGeminiClient();

    const formattedPapers = papers.map((paper: any, idx: number) => {
      const pageExcerpt = formatPaperContext(paper.pages || [], 12);
      return `=== PAPER ${idx + 1}: "${paper.title}" ===
Authors: ${paper.authors || 'Unknown'} (${paper.year || 'N/A'})
Abstract: ${paper.abstract || 'N/A'}
Key Excerpts:
${pageExcerpt}
`;
    }).join('\n\n====================\n\n');

    const langInstruction = language === 'th'
      ? 'Generate all matrix cells, comparative verdict, and critical insights in Thai (ภาษาไทย).'
      : 'Generate in rigorous, high-level comparative academic English.';

    const systemPrompt = `You are a Principal AI & Literature Synthesis Researcher.
Perform an objective, rigorous, side-by-side comparative analysis of the provided research papers.
${langInstruction}

Return a valid JSON object matching this schema:
{
  "comparisonTitle": string,
  "synthesisOverview": string (executive summary comparing the distinct paradigms, evolutionary lineage, or competing philosophies),
  "dimensions": [
    {
      "dimension": string (e.g. "Core Problem & Hypothesis", "Methodological Architecture", "Empirical Evaluation & Benchmarks", "Key Advantages", "Critical Limitations & Bottlenecks", "Compute & Practical Complexity"),
      "paperAssessments": [
        {
          "paperTitle": string,
          "assessment": string,
          "ratingOrHighlight": string (e.g. "State-of-the-art accuracy", "High memory overhead", "Zero-shot generalist")
        }
      ]
    }
  ],
  "commonGround": [string] (agreed principles or shared techniques across both papers),
  "keyDivergences": [string] (where the authors fundamentally disagree or choose opposite trade-offs),
  "selectionGuide": [
    {
      "scenario": string (e.g. "Resource-constrained edge deployment", "Maximum reasoning accuracy", "Low-latency streaming"),
      "recommendedPaper": string,
      "rationale": string
    }
  ]
}`;

    const prompt = `Compare these research papers:
${formattedPapers}

${focusAreas.length > 0 ? `Specific Areas of Interest: ${focusAreas.join(', ')}` : ''}

Generate the comprehensive comparison matrix in JSON now.`;

    const response = await generateWithGemini(ai, {
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
      },
    });

    const parsedData = safeParseJson(response.text || '{}');
    res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error('Error in /api/compare:', error);
    res.status(500).json({ error: error?.message || 'Failed to compare papers' });
  }
});

// 4. Research Gap Discovery Endpoint
app.post('/api/gaps', async (req: Request, res: Response) => {
  try {
    const { papers, language = 'en', topicContext } = req.body;

    if (!papers || !Array.isArray(papers) || papers.length === 0) {
      res.status(400).json({ error: 'At least one paper is required to discover research gaps.' });
      return;
    }

    const ai = getGeminiClient();

    const formattedPapers = papers.map((paper: any, idx: number) => {
      const pageExcerpt = formatPaperContext(paper.pages || [], 15);
      return `=== PAPER ${idx + 1}: "${paper.title}" ===
Abstract: ${paper.abstract || 'N/A'}
Content Excerpts:
${pageExcerpt}`;
    }).join('\n\n');

    const langInstruction = language === 'th'
      ? 'Output the research gaps, hypotheses, and grant proposal hooks in academic Thai (ภาษาไทย).'
      : 'Output in cutting-edge academic English.';

    const systemPrompt = `You are an elite Research Director, NSF/DARPA reviewer, and Research Gap Specialist.
Your goal is to pinpoint unaddressed questions, dataset biases, algorithmic blind spots, scalability limits, and untapped cross-disciplinary intersections in the provided paper(s).
${langInstruction}

You must return a valid JSON object matching this schema:
{
  "domainOverview": string,
  "identifiedGaps": [
    {
      "id": string (e.g. "GAP-1"),
      "title": string,
      "category": "Theoretical / Formal" | "Empirical / Evaluation" | "Methodological & Scalability" | "Domain Generalization" | "Safety & Ethics",
      "severity": "Critical" | "High" | "Moderate",
      "gapDescription": string (detailed breakdown of what is missing or unproven),
      "whyItMatters": string (impact on real-world adoption or theoretical foundation),
      "currentPaperLimitation": string (direct reference to where the authors fell short or stopped),
      "proposedHypothesis": string (testable scientific hypothesis to address this gap),
      "suggestedMethodology": string (concrete experimental design or model tweak to execute),
      "difficultyLevel": "Graduate Thesis" | "Workshop Paper" | "Flagship Conference Paper (NeurIPS/ICLR level)"
    }
  ],
  "emergingTrends": [string],
  "grantProposalHook": string (a 1-paragraph research grant or thesis pitch highlighting these discovered gaps)
}`;

    const prompt = `Examine the literature below and formulate novel research gaps:
${topicContext ? `Domain/Context: ${topicContext}\n` : ''}
${formattedPapers}

Uncover high-impact research gaps and return the JSON.`;

    const response = await generateWithGemini(ai, {
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
      },
    });

    const parsedData = safeParseJson(response.text || '{}');
    res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error('Error in /api/gaps:', error);
    res.status(500).json({ error: error?.message || 'Failed to discover research gaps' });
  }
});

// Setup Vite middleware in development or static serving in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PaperMind AI Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
