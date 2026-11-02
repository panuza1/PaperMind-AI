import React, { useState } from 'react';
import {
  Lightbulb,
  Sparkles,
  Download,
  Copy,
  Check,
  CheckSquare,
  Square,
  AlertCircle,
  FlaskConical,
  Target,
  FileCheck,
  Award,
  TrendingUp,
} from 'lucide-react';
import { Paper, ResearchGapResult, Language } from '../types';
import { translations } from '../utils/i18n';
import { discoverResearchGaps } from '../services/api';
import {
  exportGapsToMarkdown,
  downloadMarkdownFile,
  loadStoredGaps,
  saveStoredGaps,
} from '../utils/storage';

interface ResearchGapsViewProps {
  papers: Paper[];
  language: Language;
}

export const ResearchGapsView: React.FC<ResearchGapsViewProps> = ({
  papers,
  language,
}) => {
  const t = translations[language];

  // Default select first paper or all if small
  const [selectedPaperIds, setSelectedPaperIds] = useState<string[]>(
    papers.slice(0, 2).map((p) => p.id)
  );

  const [storedGaps, setStoredGaps] = useState<ResearchGapResult[]>(() => loadStoredGaps());
  const [activeGaps, setActiveGaps] = useState<ResearchGapResult | null>(
    storedGaps[0] || null
  );

  const [topicContext, setTopicContext] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [gapLanguage, setGapLanguage] = useState<Language>(language);

  const togglePaperSelection = (id: string) => {
    setSelectedPaperIds((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]
    );
  };

  const handleDiscoverGaps = async () => {
    if (selectedPaperIds.length === 0) return;

    const selectedPapers = papers.filter((p) => selectedPaperIds.includes(p.id));
    setIsLoading(true);
    setError(null);

    try {
      const result = await discoverResearchGaps(selectedPapers, gapLanguage, topicContext);
      const updated = [result, ...storedGaps.slice(0, 9)];
      setStoredGaps(updated);
      saveStoredGaps(updated);
      setActiveGaps(result);
    } catch (err: any) {
      console.error('Gap discovery error:', err);
      setError(err?.message || 'Failed to analyze research gaps. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyMarkdown = () => {
    if (!activeGaps) return;
    const md = exportGapsToMarkdown(activeGaps);
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    if (!activeGaps) return;
    const md = exportGapsToMarkdown(activeGaps);
    downloadMarkdownFile(`research-gaps-${Date.now()}.md`, md);
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Header & Configuration */}
      <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              <span>{t.gaps.title}</span>
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {t.gaps.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400">Language:</span>
            <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5 text-xs">
              <button
                onClick={() => setGapLanguage('en')}
                className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                  gapLanguage === 'en'
                    ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs'
                    : 'text-zinc-500'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setGapLanguage('th')}
                className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                  gapLanguage === 'th'
                    ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs'
                    : 'text-zinc-500'
                }`}
              >
                ไทย
              </button>
            </div>
          </div>
        </div>

        {/* Paper Selector */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
            {t.gaps.selectPapers}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {papers.map((p) => {
              const isSelected = selectedPaperIds.includes(p.id);
              return (
                <div
                  key={p.id}
                  onClick={() => togglePaperSelection(p.id)}
                  className={`p-2.5 rounded-xl border text-xs cursor-pointer flex items-center gap-2.5 transition-all ${
                    isSelected
                      ? 'bg-amber-50/40 dark:bg-amber-950/30 border-amber-500/60 text-zinc-900 dark:text-zinc-100'
                      : 'bg-zinc-50/50 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  <div className="text-amber-500">
                    {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-zinc-400" />}
                  </div>
                  <span className="truncate font-medium">{p.title}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Context / Prompt Tuning Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
            Optional Focus / Subdomain Context:
          </label>
          <input
            type="text"
            value={topicContext}
            onChange={(e) => setTopicContext(e.target.value)}
            placeholder="e.g. Zero-shot reasoning on edge devices, mathematical proofs, mitigating reward hacking..."
            className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/50"
          />
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={handleDiscoverGaps}
            disabled={selectedPaperIds.length === 0 || isLoading}
            className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-amber-600/20 transition-all disabled:opacity-40 active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isLoading ? t.gaps.discovering : t.gaps.discoverBtn}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="p-10 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center space-y-3 animate-pulse">
          <div className="w-10 h-10 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            {t.gaps.discovering}
          </h4>
          <p className="text-xs text-zinc-500 max-w-md mx-auto">
            Critically auditing theoretical guarantees, testing boundary assumptions, and architecting novel testable hypotheses with Gemini 3.8 Flash.
          </p>
        </div>
      )}

      {/* Results Display */}
      {activeGaps && !isLoading && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Header Bar */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100">
                Identified Frontiers ({activeGaps.identifiedGaps.length} Gaps Discovered)
              </h3>
              <p className="text-xs text-zinc-400">
                Grounding papers: {activeGaps.paperTitles.join(', ')}
              </p>
            </div>

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

          {/* Domain Overview */}
          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              {t.gaps.domainOverview}
            </span>
            <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-line">
              {activeGaps.domainOverview}
            </p>
          </div>

          {/* Gap Cards */}
          <div className="space-y-4">
            {activeGaps.identifiedGaps.map((gap, idx) => (
              <div
                key={gap.id || idx}
                className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-4 shadow-xs"
              >
                {/* Top Badge Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      {idx + 1}. {gap.title}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                      {gap.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                        gap.severity === 'Critical'
                          ? 'bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-400'
                          : gap.severity === 'High'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-400'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-400'
                      }`}
                    >
                      {gap.severity}
                    </span>

                    <span className="text-[10px] font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                      {gap.difficultyLevel}
                    </span>
                  </div>
                </div>

                {/* Gap Description & Why It Matters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                      {t.gaps.gapDesc}
                    </span>
                    <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                      {gap.gapDescription}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                      {t.gaps.whyMatters}
                    </span>
                    <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                      {gap.whyItMatters}
                    </p>
                  </div>
                </div>

                {/* Direct Paper Limitation */}
                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200/60 dark:border-zinc-800/80 text-xs text-zinc-600 dark:text-zinc-400">
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    {t.gaps.paperLimitation}:
                  </span>{' '}
                  {gap.currentPaperLimitation}
                </div>

                {/* Novel Testable Hypothesis Banner */}
                <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/60 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                    <FlaskConical className="w-3.5 h-3.5" />
                    <span>{t.gaps.hypothesis}</span>
                  </div>
                  <p className="text-xs sm:text-sm font-medium italic text-indigo-950 dark:text-indigo-200 leading-relaxed">
                    "{gap.proposedHypothesis}"
                  </p>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 pt-1">
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                      {t.gaps.methodology}:
                    </span>{' '}
                    {gap.suggestedMethodology}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Emerging Trends */}
          {activeGaps.emergingTrends && activeGaps.emergingTrends.length > 0 && (
            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span>{t.gaps.emergingTrends}</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {activeGaps.emergingTrends.map((trend, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200/70 dark:border-zinc-800/70 text-xs text-zinc-700 dark:text-zinc-300"
                  >
                    • {trend}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Grant Proposal / Dissertation Pitch */}
          {activeGaps.grantProposalHook && (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200/60 dark:border-amber-800/60 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                <Award className="w-4 h-4" />
                <span>{t.gaps.grantHook}</span>
              </span>
              <p className="text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed italic">
                "{activeGaps.grantProposalHook}"
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
