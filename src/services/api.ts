import { Language, Paper, PaperSummary, ComparisonResult, ResearchGapResult, ChatMessage, Citation } from '../types';

export class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function checkServerHealth(): Promise<{ status: string; hasApiKey: boolean; model: string }> {
  try {
    const res = await fetch('/api/health');
    if (!res.ok) throw new Error(`Health check failed with status: ${res.status}`);
    return await res.json();
  } catch (err: any) {
    return { status: 'error', hasApiKey: false, model: 'unknown' };
  }
}

export async function generatePaperSummary(paper: Paper, language: Language = 'en'): Promise<PaperSummary> {
  const response = await fetch('/api/summarize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: paper.title,
      authors: paper.authors,
      year: paper.year,
      abstract: paper.abstract,
      pages: paper.pages,
      language,
    }),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new ApiError(data.error || 'Failed to generate summary', response.status);
  }

  return {
    ...data.data,
    generatedAt: new Date().toISOString(),
    language,
  };
}

export async function askPaperQuestion(
  paper: Paper,
  query: string,
  history: ChatMessage[] = [],
  language: Language = 'en'
): Promise<{ answer: string; citations: Citation[]; suggestedFollowUps: string[] }> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: paper.title,
      pages: paper.pages,
      history,
      query,
      language,
    }),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new ApiError(data.error || 'Failed to process question', response.status);
  }

  return {
    answer: data.data.answer || 'No answer generated.',
    citations: data.data.citations || [],
    suggestedFollowUps: data.data.suggestedFollowUps || [],
  };
}

export async function compareMultiplePapers(
  papers: Paper[],
  language: Language = 'en',
  focusAreas: string[] = []
): Promise<ComparisonResult> {
  const response = await fetch('/api/compare', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      papers: papers.map(p => ({
        id: p.id,
        title: p.title,
        authors: p.authors,
        year: p.year,
        abstract: p.abstract,
        pages: p.pages,
      })),
      language,
      focusAreas,
    }),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new ApiError(data.error || 'Failed to execute comparative analysis', response.status);
  }

  return {
    id: `comp-${Date.now()}`,
    paperIds: papers.map(p => p.id),
    paperTitles: papers.map(p => p.title),
    comparisonTitle: data.data.comparisonTitle || 'Multi-Paper Comparative Synthesis',
    synthesisOverview: data.data.synthesisOverview || '',
    dimensions: data.data.dimensions || [],
    commonGround: data.data.commonGround || [],
    keyDivergences: data.data.keyDivergences || [],
    selectionGuide: data.data.selectionGuide || [],
    createdAt: new Date().toISOString(),
    language,
  };
}

export async function discoverResearchGaps(
  papers: Paper[],
  language: Language = 'en',
  topicContext?: string
): Promise<ResearchGapResult> {
  const response = await fetch('/api/gaps', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      papers: papers.map(p => ({
        id: p.id,
        title: p.title,
        authors: p.authors,
        year: p.year,
        abstract: p.abstract,
        pages: p.pages,
      })),
      language,
      topicContext,
    }),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new ApiError(data.error || 'Failed to discover research gaps', response.status);
  }

  return {
    id: `gaps-${Date.now()}`,
    paperIds: papers.map(p => p.id),
    paperTitles: papers.map(p => p.title),
    domainOverview: data.data.domainOverview || '',
    identifiedGaps: data.data.identifiedGaps || [],
    emergingTrends: data.data.emergingTrends || [],
    grantProposalHook: data.data.grantProposalHook || '',
    createdAt: new Date().toISOString(),
    language,
  };
}
