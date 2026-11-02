import React, { useState } from 'react';
import { X, BookOpen, Quote, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { Paper, Citation } from '../types';

interface CitationInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  citation: Citation | null;
  paper: Paper | null;
  initialPage?: number;
}

export const CitationInspectorModal: React.FC<CitationInspectorModalProps> = ({
  isOpen,
  onClose,
  citation,
  paper,
  initialPage,
}) => {
  if (!isOpen || !paper) return null;

  const targetPageNumber = initialPage || citation?.page || 1;
  const [currentPage, setCurrentPage] = useState<number>(targetPageNumber);

  const pageData = paper.pages.find((p) => p.pageNumber === currentPage);

  // Simple text highlight of quote if present
  const renderHighlightedText = (text: string, quote?: string) => {
    if (!quote || quote.length < 5) {
      return <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed">{text}</pre>;
    }

    // Try finding a chunk of the quote
    const cleanQuote = quote.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    try {
      const regex = new RegExp(`(${cleanQuote.slice(0, 40)})`, 'i');
      const parts = text.split(regex);
      return (
        <div className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-zinc-700 dark:text-zinc-300">
          {parts.map((part, i) =>
            regex.test(part) ? (
              <mark
                key={i}
                className="bg-amber-200 dark:bg-amber-900/60 text-zinc-900 dark:text-amber-100 px-1 py-0.5 rounded font-medium border border-amber-300 dark:border-amber-700"
              >
                {part}
              </mark>
            ) : (
              part
            )
          )}
        </div>
      );
    } catch {
      return <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed">{text}</pre>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[85vh] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-950/50">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <span>Verified Source Excerpt</span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                  Page {currentPage} of {paper.totalPages}
                </span>
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate max-w-md">
                {paper.title}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cited Quote Callout */}
        {citation && citation.quote && (
          <div className="mx-5 mt-4 p-3.5 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 rounded-xl space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wide">
              <Quote className="w-3.5 h-3.5" />
              <span>Cited Evidence Snippet (Page {citation.page})</span>
            </div>
            <p className="text-xs italic text-amber-950 dark:text-amber-200 leading-relaxed">
              "{citation.quote}"
            </p>
            {citation.relevance && (
              <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium pt-1">
                <span className="font-semibold">Context:</span> {citation.relevance}
              </p>
            )}
          </div>
        )}

        {/* Page Content Body */}
        <div className="p-5 overflow-y-auto flex-1 font-sans">
          {pageData ? (
            <div className="bg-zinc-50 dark:bg-zinc-950/40 p-4 rounded-xl border border-zinc-200/70 dark:border-zinc-800/80">
              {renderHighlightedText(pageData.text, citation?.quote)}
            </div>
          ) : (
            <div className="text-center py-10 text-xs text-zinc-400">
              Page content not available.
            </div>
          )}
        </div>

        {/* Pagination Footer */}
        <div className="px-5 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-1 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-zinc-600 dark:text-zinc-400 font-mono text-[11px]">
              {currentPage} / {paper.totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(paper.totalPages, p + 1))}
              disabled={currentPage >= paper.totalPages}
              className="p-1 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
