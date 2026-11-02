import React, { useState } from 'react';
import {
  GitCompare,
  Sparkles,
  Download,
  Copy,
  Check,
  CheckSquare,
  Square,
  Layers,
  ArrowRight,
  Clock,
  History,
  FileText,
} from 'lucide-react';
import { Paper, ComparisonResult, Language } from '../types';
import { translations } from '../utils/i18n';
import { compareMultiplePapers } from '../services/api';
import {
  exportComparisonToMarkdown,
  downloadMarkdownFile,
  loadStoredComparisons,
  saveStoredComparisons,
} from '../utils/storage';

interface MultiPaperComparisonViewProps {
  papers: Paper[];
  language: Language;
}

export const MultiPaperComparisonView: React.FC<MultiPaperComparisonViewProps> = ({
  papers,
  language,
}) => {
  const t = translations[language];

  // Default select first two papers if available
  const [selectedPaperIds, setSelectedPaperIds] = useState<string[]>(
    papers.slice(0, 2).map((p) => p.id)
  );

  const [comparisons, setComparisons] = useState<ComparisonResult[]>(() => loadStoredComparisons());
  const [activeComparison, setActiveComparison] = useState<ComparisonResult | null>(
    comparisons[0] || null
  );

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [compLanguage, setCompLanguage] = useState<Language>(language);

  // Focus areas
  const FOCUS_OPTIONS = [
    'Architecture & Algorithmic Design',
    'Benchmark Results & Accuracy',
    'Computational Efficiency & GPU Hours',
    'Inference Latency & Memory Footprint',
    'Generalization & Failure Cases',
  ];
  const [selectedFocus, setSelectedFocus] = useState<string[]>([
    'Architecture & Algorithmic Design',
    'Benchmark Results & Accuracy',
    'Computational Efficiency & GPU Hours',
  ]);

  const togglePaperSelection = (id: string) => {
    setSelectedPaperIds((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]
    );
  };

  const toggleFocus = (focus: string) => {
    setSelectedFocus((prev) =>
      prev.includes(focus) ? prev.filter((f) => f !== focus) : [...prev, focus]
    );
  };

  const handleRunComparison = async () => {
    if (selectedPaperIds.length < 2) return;

    const selectedPapers = papers.filter((p) => selectedPaperIds.includes(p.id));
    setIsLoading(true);
    setError(null);

    try {
      const result = await compareMultiplePapers(selectedPapers, compLanguage, selectedFocus);
      const updated = [result, ...comparisons.slice(0, 9)];
      setComparisons(updated);
      saveStoredComparisons(updated);
      setActiveComparison(result);
    } catch (err: any) {
      console.error('Comparison error:', err);
      setError(err?.message || 'Failed to compare papers. Please check network connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyMarkdown = () => {
    if (!activeComparison) return;
    const md = exportComparisonToMarkdown(activeComparison);
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    if (!activeComparison) return;
    const md = exportComparisonToMarkdown(activeComparison);
    downloadMarkdownFile(`comparison-${Date.now()}.md`, md);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Configuration Header Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <GitCompare className="w-5 h-5 text-indigo-500" />
              <span>{t.compare.title}</span>
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {t.compare.subtitle}
            </p>
          </div>

          {/* Language selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400">Language:</span>
            <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5 text-xs">
              <button
                onClick={() => setCompLanguage('en')}
                className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                  compLanguage === 'en'
                    ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs'
                    : 'text-zinc-500'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setCompLanguage('th')}
                className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                  compLanguage === 'th'
                    ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs'
                    : 'text-zinc-500'
                }`}
              >
                ไทย
              </button>
            </div>
          </div>
        </div>

        {/* Paper Selection Checklist */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-600 dark:text-zinc-400">
            <span>Select Papers to Compare ({selectedPaperIds.length} selected):</span>
            <span className="text-[11px] text-zinc-400">Min 2 required</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {papers.map((p) => {
              const isSelected = selectedPaperIds.includes(p.id);
              return (
                <div
                  key={p.id}
                  onClick={() => togglePaperSelection(p.id)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer flex items-start gap-2.5 transition-all ${
                    isSelected
                      ? 'bg-indigo-50/50 dark:bg-indigo-950/40 border-indigo-500/60 text-zinc-900 dark:text-zinc-100 shadow-xs'
                      : 'bg-zinc-50/50 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300'
                  }`}
                >
                  <div className="mt-0.5 text-indigo-600 dark:text-indigo-400">
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4" />
                    ) : (
                      <Square className="w-4 h-4 text-zinc-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-semibold truncate">{p.title}</h4>
                    <p className="text-[11px] text-zinc-500 truncate">
                      {p.authors} ({p.year})
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Focus Areas */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
            Synthesis Focus Dimensions:
          </span>
          <div className="flex flex-wrap gap-2">
            {FOCUS_OPTIONS.map((f) => {
              const isF = selectedFocus.includes(f);
              return (
                <button
                  key={f}
                  onClick={() => toggleFocus(f)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                    isF
                      ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 font-semibold'
                      : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300'
                  }`}
                >
                  {f}
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-between pt-2">
          {comparisons.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-zinc-500">
              <History className="w-3.5 h-3.5" />
              <span>{comparisons.length} saved comparison(s)</span>
            </div>
          )}

          <button
            onClick={handleRunComparison}
            disabled={selectedPaperIds.length < 2 || isLoading}
            className="ml-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-indigo-600/20 transition-all disabled:opacity-40 active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isLoading ? t.compare.comparing : t.compare.compareBtn}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="p-10 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center space-y-3 animate-pulse">
          <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            {t.compare.comparing}
          </h4>
          <p className="text-xs text-zinc-500 max-w-md mx-auto">
            Reading multiple papers, cross-referencing experimental baselines, and building side-by-side assessment matrices with Gemini 3.8 Flash.
          </p>
        </div>
      )}

      {/* Comparison Result Display */}
      {activeComparison && !isLoading && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Result Action Bar */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100">
              {activeComparison.comparisonTitle}
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyMarkdown}
                className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs text-zinc-700 dark:text-zinc-300 font-semibold flex items-center gap-1.5 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? t.common.copied : t.common.copyMarkdown}</span>
              </button>
              <button
                onClick={handleDownloadMarkdown}
                className="px-3 py-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold flex items-center gap-1.5 hover:opacity-90 transition-opacity"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{t.common.download}</span>
              </button>
            </div>
          </div>

          {/* Synthesis Overview */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/30 dark:to-purple-950/20 border border-indigo-200/50 dark:border-indigo-800/50 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
              {t.compare.synthesisVerdict}
            </span>
            <p className="text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-line">
              {activeComparison.synthesisOverview}
            </p>
          </div>

          {/* Comparison Matrix Table */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-xs">
            <div className="px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 font-bold text-xs uppercase tracking-wider text-zinc-500">
              {t.compare.dimensionsHeader}
            </div>

            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {activeComparison.dimensions.map((dim, idx) => (
                <div key={idx} className="p-5 space-y-3">
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    <span>{dim.dimension}</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {dim.paperAssessments.map((pa, paIdx) => (
                      <div
                        key={paIdx}
                        className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200/70 dark:border-zinc-800/80 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                            {pa.paperTitle}
                          </span>
                          <span className="text-[10px] font-medium font-mono px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 flex-shrink-0">
                            {pa.ratingOrHighlight}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                          {pa.assessment}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Common Ground & Key Divergences */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Common Ground */}
            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                {t.compare.commonGround}
              </h4>
              <ul className="space-y-2">
                {activeComparison.commonGround.map((item, idx) => (
                  <li key={idx} className="text-xs text-zinc-700 dark:text-zinc-300 flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Key Divergences */}
            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                {t.compare.divergences}
              </h4>
              <ul className="space-y-2">
                {activeComparison.keyDivergences.map((item, idx) => (
                  <li key={idx} className="text-xs text-zinc-700 dark:text-zinc-300 flex items-start gap-2">
                    <span className="text-amber-500 font-bold">≠</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Decision & Selection Guide */}
          {activeComparison.selectionGuide && activeComparison.selectionGuide.length > 0 && (
            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                {t.compare.selectionGuide}
              </h4>

              <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 dark:bg-zinc-950 text-zinc-500 font-semibold border-b border-zinc-200 dark:border-zinc-800">
                    <tr>
                      <th className="py-2.5 px-3">{t.compare.scenario}</th>
                      <th className="py-2.5 px-3">{t.compare.recommendation}</th>
                      <th className="py-2.5 px-3">{t.compare.rationale}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-zinc-800 dark:text-zinc-200">
                    {activeComparison.selectionGuide.map((sg, idx) => (
                      <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-950/30">
                        <td className="py-2.5 px-3 font-semibold text-zinc-900 dark:text-zinc-100">
                          {sg.scenario}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-indigo-600 dark:text-indigo-400">
                          {sg.recommendedPaper}
                        </td>
                        <td className="py-2.5 px-3 text-zinc-600 dark:text-zinc-400">
                          {sg.rationale}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
