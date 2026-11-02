import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Sparkles,
  Download,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Cpu,
  Layers,
  Tag,
  ArrowRight,
  ExternalLink,
  BookOpen,
  RefreshCw,
} from 'lucide-react';
import { Paper, PaperSummary, Language } from '../types';
import { translations } from '../utils/i18n';
import { generatePaperSummary } from '../services/api';
import { exportSummaryToMarkdown, downloadMarkdownFile } from '../utils/storage';
import { CitationInspectorModal } from './CitationInspectorModal';

interface DeepSummaryViewProps {
  paper: Paper | null;
  onUpdatePaper: (paper: Paper) => void;
  language: Language;
}

export const DeepSummaryView: React.FC<DeepSummaryViewProps> = ({
  paper,
  onUpdatePaper,
  language,
}) => {
  const t = translations[language];

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [summaryLang, setSummaryLang] = useState<Language>(language);

  // Inspector modal state
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [selectedPage, setSelectedPage] = useState<number>(1);

  if (!paper) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] p-8 text-center text-zinc-500">
        <BookOpen className="w-12 h-12 mb-3 text-zinc-400" />
        <h3 className="text-base font-bold text-zinc-700 dark:text-zinc-300 mb-1">
          No Paper Selected
        </h3>
        <p className="text-xs max-w-sm">
          Please select a research paper from your library to view or generate its structured academic summary.
        </p>
      </div>
    );
  }

  const summary = paper.summary;

  const handleGenerateSummary = async (lang: Language = summaryLang) => {
    setIsLoading(true);
    setError(null);
    try {
      const generated = await generatePaperSummary(paper, lang);
      onUpdatePaper({
        ...paper,
        summary: generated,
      });
    } catch (err: any) {
      console.error('Failed to generate summary:', err);
      setError(err?.message || 'Failed to synthesize summary. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyMarkdown = () => {
    if (!summary) return;
    const md = exportSummaryToMarkdown(paper);
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    if (!summary) return;
    const md = exportSummaryToMarkdown(paper);
    downloadMarkdownFile(`${paper.title}-summary.md`, md);
  };

  const openPageInspector = (pageRef: number | string) => {
    const pageNum = typeof pageRef === 'number' ? pageRef : parseInt(String(pageRef).replace(/\D/g, ''), 10) || 1;
    setSelectedPage(pageNum);
    setInspectorOpen(true);
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Header Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              {t.summary.title}
            </span>
            <span className="text-zinc-300 dark:text-zinc-700">•</span>
            <span className="text-[11px] text-zinc-400 font-mono">
              {paper.totalPages} {t.common.pages}
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100 leading-snug">
            {paper.title}
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            {paper.authors} ({paper.year})
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
          {/* Language Selector for Generation */}
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => {
                setSummaryLang('en');
                if (summary) handleGenerateSummary('en');
              }}
              className={`px-2 py-1 rounded-md font-medium transition-colors ${
                summaryLang === 'en'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs'
                  : 'text-zinc-500'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => {
                setSummaryLang('th');
                if (summary) handleGenerateSummary('th');
              }}
              className={`px-2 py-1 rounded-md font-medium transition-colors ${
                summaryLang === 'th'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs'
                  : 'text-zinc-500'
              }`}
            >
              ไทย
            </button>
          </div>

          {summary ? (
            <>
              <button
                onClick={() => handleGenerateSummary(summaryLang)}
                disabled={isLoading}
                className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                title="Regenerate"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Regenerate</span>
              </button>

              <button
                onClick={handleCopyMarkdown}
                className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? t.common.copied : t.common.copyMarkdown}</span>
              </button>

              <button
                onClick={handleDownloadMarkdown}
                className="px-3.5 py-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:opacity-90 text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-opacity"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{t.common.download}</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => handleGenerateSummary(summaryLang)}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isLoading ? t.summary.generating : t.summary.generateBtn}</span>
            </button>
          )}
        </div>
      </div>

      {/* Loading Bar */}
      {isLoading && (
        <div className="p-8 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center space-y-3 animate-pulse">
          <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            {t.summary.generating}
          </h4>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Extracting core technical insights, evaluating benchmark tables, and grounding evidence from all {paper.totalPages} pages.
          </p>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Structured Summary Content */}
      {summary && !isLoading && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Quick Takeaway Banner */}
          {summary.quickTakeaway && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/30 border border-indigo-200/60 dark:border-indigo-800/60 flex items-start gap-3">
              <div className="p-1 rounded-md bg-indigo-600 text-white flex-shrink-0 mt-0.5">
                <Lightbulb className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                  {t.summary.quickTakeaway}
                </span>
                <p className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">
                  "{summary.quickTakeaway}"
                </p>
              </div>
            </div>
          )}

          {/* Grid: Executive Summary & Problem Statement */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-indigo-500" />
                <span>{t.summary.executiveSummary}</span>
              </h3>
              <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-line">
                {summary.executiveSummary}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-purple-500" />
                <span>{t.summary.problemStatement}</span>
              </h3>
              <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-line">
                {summary.problemStatement}
              </p>
            </div>
          </div>

          {/* Methodology & Architecture */}
          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-blue-500" />
              <span>{t.summary.methodology}</span>
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/60 dark:border-zinc-800/80 space-y-1">
                <span className="text-[11px] font-semibold text-zinc-500">Core Architecture:</span>
                <p className="text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed">
                  {summary.methodology.architecture}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/60 dark:border-zinc-800/80 space-y-1.5">
                <span className="text-[11px] font-semibold text-zinc-500">{t.summary.keyInnovations}:</span>
                <ul className="space-y-1">
                  {summary.methodology.keyInnovations.map((inn, idx) => (
                    <li key={idx} className="text-xs text-zinc-800 dark:text-zinc-200 flex items-start gap-1.5">
                      <span className="text-indigo-500 font-bold">•</span>
                      <span>{inn}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/60 dark:border-zinc-800/80 space-y-1">
                <span className="text-[11px] font-semibold text-zinc-500">{t.summary.trainingSetup}:</span>
                <p className="text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed">
                  {summary.methodology.trainingOrExperimentalSetup}
                </p>
              </div>
            </div>
          </div>

          {/* Key Findings & Verified Benchmarks Table */}
          {summary.keyFindings && summary.keyFindings.length > 0 && (
            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  {t.summary.findings}
                </h3>
                <span className="text-[11px] text-zinc-400 font-medium">
                  Verified Page References
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 dark:bg-zinc-950 text-zinc-500 font-semibold border-b border-zinc-200 dark:border-zinc-800">
                    <tr>
                      <th className="py-2.5 px-3">{t.summary.metric}</th>
                      <th className="py-2.5 px-3">{t.summary.result}</th>
                      <th className="py-2.5 px-3">{t.summary.reference}</th>
                      <th className="py-2.5 px-3">{t.summary.interpretation}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-zinc-800 dark:text-zinc-200">
                    {summary.keyFindings.map((finding, idx) => (
                      <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-950/30 transition-colors">
                        <td className="py-2.5 px-3 font-medium text-zinc-900 dark:text-zinc-100">
                          {finding.metricOrFinding}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {finding.result}
                        </td>
                        <td className="py-2.5 px-3">
                          <button
                            onClick={() => openPageInspector(finding.pageReference)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-mono text-[11px] font-semibold border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition-colors cursor-pointer"
                          >
                            <ExternalLink className="w-2.5 h-2.5" />
                            <span>Page {finding.pageReference}</span>
                          </button>
                        </td>
                        <td className="py-2.5 px-3 text-zinc-600 dark:text-zinc-400">
                          {finding.interpretation}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Strengths & Limitations Side by Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Strengths */}
            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>{t.summary.strengths}</span>
              </h3>
              <ul className="space-y-2">
                {summary.strengths.map((str, idx) => (
                  <li key={idx} className="text-xs text-zinc-700 dark:text-zinc-300 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Limitations */}
            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                <span>{t.summary.limitations}</span>
              </h3>
              <ul className="space-y-2">
                {summary.limitations.map((lim, idx) => (
                  <li key={idx} className="text-xs text-zinc-700 dark:text-zinc-300 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                    <span>{lim}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Practical Applications */}
          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
              <ArrowRight className="w-4 h-4 text-indigo-500" />
              <span>{t.summary.applications}</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {summary.practicalApplications.map((app, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200/60 dark:border-zinc-800/70 text-xs text-zinc-800 dark:text-zinc-200">
                  {app}
                </div>
              ))}
            </div>
          </div>

          {/* Keywords */}
          {summary.keywords && summary.keywords.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-2">
              <Tag className="w-3.5 h-3.5 text-zinc-400 mr-1" />
              {summary.keywords.map((kw, idx) => (
                <span
                  key={idx}
                  className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
                >
                  #{kw}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Citation Inspector Modal */}
      <CitationInspectorModal
        isOpen={inspectorOpen}
        onClose={() => setInspectorOpen(false)}
        citation={null}
        paper={paper}
        initialPage={selectedPage}
      />
    </div>
  );
};
