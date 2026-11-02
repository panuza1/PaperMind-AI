import * as pdfjsLib from 'pdfjs-dist';
import { PageContent } from '../types';

// Configure the worker for pdfjs-dist
if (typeof window !== 'undefined') {
  try {
    // Set standard reliable worker CDN matching the installed version (4.10.38)
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs`;
  } catch (e) {
    console.warn('Failed to configure PDF worker via CDN, attempting inline fallback:', e);
  }
}

export interface ExtractedPdfData {
  title: string;
  authors: string;
  year: string;
  abstract: string;
  totalPages: number;
  fileSize: number;
  pages: PageContent[];
}

export async function extractTextFromPdf(
  file: File,
  onProgress?: (current: number, total: number) => void
): Promise<ExtractedPdfData> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    useSystemFonts: true,
  });

  const pdfDocument = await loadingTask.promise;
  const numPages = pdfDocument.numPages;
  const pages: PageContent[] = [];

  for (let i = 1; i <= numPages; i++) {
    const page = await pdfDocument.getPage(i);
    const textContent = await page.getTextContent();
    
    // Combine text items with spacing
    let lastY: number | null = null;
    let pageText = '';

    for (const item of textContent.items) {
      if ('str' in item) {
        // Detect vertical jump for newlines
        const currentY = 'transform' in item ? item.transform[5] : null;
        if (lastY !== null && currentY !== null && Math.abs(currentY - lastY) > 6) {
          pageText += '\n';
        } else if (pageText.length > 0 && !pageText.endsWith(' ') && !pageText.endsWith('\n')) {
          pageText += ' ';
        }
        pageText += item.str;
        if (currentY !== null) lastY = currentY;
      }
    }

    pages.push({
      pageNumber: i,
      text: pageText.trim(),
    });

    if (onProgress) {
      onProgress(i, numPages);
    }
  }

  // Attempt smart extraction of Title, Authors, and Abstract from Page 1
  const firstPageText = pages[0]?.text || '';
  const lines = firstPageText.split('\n').map(l => l.trim()).filter(Boolean);

  let guessedTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
  let guessedAuthors = 'Authors not detected';
  let guessedYear = new Date().getFullYear().toString();
  let guessedAbstract = '';

  if (lines.length > 0) {
    // If the first line is reasonable length, use it as title
    if (lines[0].length < 150) {
      guessedTitle = lines[0];
    }
    // Search for year (4-digit number like 2017-2026)
    const yearMatch = firstPageText.match(/\b(19\d{2}|20\d{2})\b/);
    if (yearMatch) {
      guessedYear = yearMatch[1];
    }
    // Search for Abstract section
    const abstractMatch = firstPageText.match(/(?:Abstract|ABSTRACT)[\s:—–.-]+([\s\S]{100,1200}?)(?=(?:Introduction|1\.|1\s+Introduction|Keywords|INDEX|Categories|\n\n[A-Z]))/i);
    if (abstractMatch && abstractMatch[1]) {
      guessedAbstract = abstractMatch[1].trim().replace(/\s+/g, ' ');
    } else if (lines.length > 3) {
      guessedAbstract = lines.slice(1, 5).join(' ');
    }

    // Try finding authors between title and abstract
    if (lines.length > 2) {
      const candidateAuthors = lines.slice(1, 3).join(', ');
      if (!candidateAuthors.toLowerCase().includes('abstract') && candidateAuthors.length < 200) {
        guessedAuthors = candidateAuthors;
      }
    }
  }

  return {
    title: guessedTitle,
    authors: guessedAuthors,
    year: guessedYear,
    abstract: guessedAbstract || 'Abstract extracted from preliminary pages.',
    totalPages: numPages,
    fileSize: file.size,
    pages,
  };
}
