import React, { useState, useEffect } from 'react';
import {
  Edit3,
  Download,
  Copy,
  Check,
  Sparkles,
  BookOpen,
  Trash2,
  FileCheck,
} from 'lucide-react';
import { Paper, Language } from '../types';
import { translations } from '../utils/i18n';
import {
  loadStoredScratchpad,
  saveStoredScratchpad,
  downloadMarkdownFile,
} from '../utils/storage';

interface ResearchScratchpadViewProps {
  activePaper: Paper | null;
  language: Language;
}

export const ResearchScratchpadView: React.FC<ResearchScratchpadViewProps> = ({
  activePaper,
  language,
}) => {
  const t = translations[language];

  const [notes, setNotes] = useState<string>(() => loadStoredScratchpad());
  const [copied, setCopied] = useState(false);
  const [lastSaved, setLastSaved] = useState<string>('Just now');

  useEffect(() => {
    saveStoredScratchpad(notes);
    setLastSaved(new Date().toLocaleTimeString());
  }, [notes]);

  const wordCount = notes.trim() ? notes.trim().split(/\s+/).length : 0;
  const charCount = notes.length;

  const handleCopy = () => {
    navigator.clipboard.writeText(notes);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    downloadMarkdownFile(`research-scratchpad-${Date.now()}.md`, notes);
  };

  const insertSnippet = (snippet: string) => {
    setNotes((prev) => `${prev}\n\n${snippet}`);
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-indigo-500" />
            <span>{t.scratchpad.title}</span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            {t.scratchpad.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs text-zinc-700 dark:text-zinc-300 font-semibold flex items-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? t.common.copied : t.common.copyMarkdown}</span>
          </button>
          <button
            onClick={handleDownload}
            className="px-3 py-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold flex items-center gap-1.5 hover:opacity-90 transition-opacity"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t.common.download}</span>
          </button>
        </div>
      </div>

      {/* Quick Insert Snippet Toolbar */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-zinc-400 font-medium">Quick Insert:</span>

        {activePaper && (
          <button
            onClick={() =>
              insertSnippet(
                `### Reference: ${activePaper.title}\n**Authors**: ${activePaper.authors} (${activePaper.year})\n> Abstract: ${activePaper.abstract}`
              )
            }
            className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-indigo-400 transition-colors flex items-center gap-1"
          >
            <BookOpen className="w-3 h-3 text-indigo-500" />
            <span>Active Paper Header</span>
          </button>
        )}

        <button
          onClick={() =>
            insertSnippet(
              `### 🧪 Novel Hypothesis\n- **Hypothesis**: \n- **Theoretical Justification**: \n- **Proposed Experiment**: \n- **Metrics of Success**: `
            )
          }
          className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-indigo-400 transition-colors"
        >
          + Hypothesis Template
        </button>

        <button
          onClick={() =>
            insertSnippet(
              `### 📊 Literature Review Checklist\n- [ ] Core problem formulation understood\n- [ ] Baseline reproduction verified\n- [ ] Mathematical proofs audited\n- [ ] Dataset limitations noted`
            )
          }
          className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-indigo-400 transition-colors"
        >
          + Literature Checklist
        </button>
      </div>

      {/* Notes Textarea Editor */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-xs flex flex-col">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t.scratchpad.placeholder}
          rows={18}
          className="w-full p-6 text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 bg-transparent placeholder-zinc-400 focus:outline-hidden font-mono leading-relaxed resize-y"
        />

        {/* Footer info */}
        <div className="px-6 py-3 border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/50 flex items-center justify-between text-[11px] text-zinc-400 font-mono">
          <div className="flex items-center gap-3">
            <span>
              {wordCount} {t.scratchpad.wordCount}
            </span>
            <span>•</span>
            <span>{charCount} characters</span>
          </div>

          <div className="flex items-center gap-1.5 text-zinc-500">
            <FileCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Saved {lastSaved}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
