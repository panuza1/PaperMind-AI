import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  Search,
  Star,
  Trash2,
  Download,
  BookOpen,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Paper, Language } from '../types';
import { translations } from '../utils/i18n';
import { extractTextFromPdf } from '../utils/pdfExtractor';
import { SAMPLE_PAPERS } from '../data/samplePapers';
import { exportSummaryToMarkdown, downloadMarkdownFile } from '../utils/storage';

interface PaperLibraryProps {
  papers: Paper[];
  activePaper: Paper | null;
  onSelectPaper: (paper: Paper) => void;
  onAddPaper: (paper: Paper) => void;
  onDeletePaper: (paperId: string) => void;
  onToggleStar: (paperId: string) => void;
  onNavigateToTab: (tab: any) => void;
  language: Language;
}

export const PaperLibrary: React.FC<PaperLibraryProps> = ({
  papers,
  activePaper,
  onSelectPaper,
  onAddPaper,
  onDeletePaper,
  onToggleStar,
  onNavigateToTab,
  language,
}) => {
  const t = translations[language];
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractProgress, setExtractProgress] = useState<{ current: number; total: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStarredOnly, setFilterStarredOnly] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Collect all unique tags
  const allTags = Array.from(new Set(papers.flatMap((p) => p.tags || [])));

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processUploadedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processUploadedFile(e.target.files[0]);
    }
  };

  const processUploadedFile = async (file: File) => {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMessage('Please upload a valid PDF document.');
      return;
    }

    setErrorMessage(null);
    setIsExtracting(true);
    setExtractProgress({ current: 0, total: 1 });

    try {
      const extracted = await extractTextFromPdf(file, (current, total) => {
        setExtractProgress({ current, total });
      });

      const newPaper: Paper = {
        id: `paper-${Date.now()}`,
        title: extracted.title,
        authors: extracted.authors,
        year: extracted.year,
        abstract: extracted.abstract,
        totalPages: extracted.totalPages,
        fileSize: extracted.fileSize,
        uploadDate: new Date().toISOString(),
        pages: extracted.pages,
        tags: ['Uploaded', 'PDF Research'],
        isStarred: false,
        fileName: file.name,
      };

      onAddPaper(newPaper);
      onSelectPaper(newPaper);
    } catch (err: any) {
      console.error('Failed to extract text from PDF:', err);
      setErrorMessage(
        err?.message || 'Could not parse the PDF file. It might be password-protected or image-only.'
      );
    } finally {
      setIsExtracting(false);
      setExtractProgress(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleLoadSample = (sample: Paper) => {
    // Check if already in library
    const exists = papers.find((p) => p.id === sample.id);
    if (!exists) {
      onAddPaper(sample);
      onSelectPaper(sample);
    } else {
      onSelectPaper(exists);
    }
    onNavigateToTab('reader');
  };

  // Filter papers
  const filteredPapers = papers.filter((paper) => {
    const matchesSearch =
      paper.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      paper.authors.toLowerCase().includes(searchQuery.toLowerCase()) ||
      paper.abstract.toLowerCase().includes(searchQuery.toLowerCase()) ||
      paper.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStarred = filterStarredOnly ? paper.isStarred : true;
    const matchesTag = selectedTag ? paper.tags.includes(selectedTag) : true;

    return matchesSearch && matchesStarred && matchesTag;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-4 sm:p-6 lg:p-8">
      {/* Hero Dropzone */}
      <div className="relative">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 group relative overflow-hidden ${
            isDragging
              ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 scale-[1.01]'
              : 'border-zinc-300 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 bg-white/50 dark:bg-zinc-900/40'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFileInputChange}
            className="hidden"
          />

          <div className="max-w-md mx-auto space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
              <Upload className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                {t.upload.title}
              </h3>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                {t.upload.subtitle}
              </p>
            </div>

            <button
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold shadow-sm group-hover:bg-indigo-600 dark:group-hover:bg-indigo-500 dark:group-hover:text-white transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{t.upload.clickToBrowse}</span>
            </button>
          </div>

          {/* Extraction Overlay */}
          {isExtracting && (
            <div className="absolute inset-0 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 space-y-3 z-10 animate-in fade-in">
              <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {t.upload.parsingPdf}
              </div>
              {extractProgress && (
                <div className="w-64 bg-zinc-200 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full transition-all duration-150"
                    style={{
                      width: `${(extractProgress.current / Math.max(extractProgress.total, 1)) * 100}%`,
                    }}
                  />
                </div>
              )}
              <div className="text-xs text-zinc-500 font-mono">
                {extractProgress
                  ? `${t.upload.extractingText} ${extractProgress.current} / ${extractProgress.total}`
                  : 'Preparing parser...'}
              </div>
            </div>
          )}
        </div>

        {errorMessage && (
          <div className="mt-3 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl flex items-center gap-2.5 text-xs text-red-600 dark:text-red-400">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Instant Exploration: Sample Papers Carousel */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{t.upload.trySamples}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          {SAMPLE_PAPERS.map((sample) => (
            <div
              key={sample.id}
              onClick={() => handleLoadSample(sample)}
              className="group p-4 bg-white dark:bg-zinc-900/80 rounded-xl border border-zinc-200/80 dark:border-zinc-800 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-2">
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                    {sample.year}
                  </span>
                  <span>{sample.totalPages} {t.common.pages}</span>
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 mb-1.5">
                  {sample.title}
                </h4>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2">
                  {sample.abstract}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
                <div className="flex gap-1 overflow-hidden">
                  {sample.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform">
                  <span>{t.common.loadSample}</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Library Section: Search & Filters */}
      <div className="space-y-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.common.searchPapers}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterStarredOnly(!filterStarredOnly)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
                filterStarredOnly
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400'
                  : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300'
              }`}
            >
              <Star
                className={`w-3.5 h-3.5 ${
                  filterStarredOnly ? 'fill-amber-400 text-amber-400' : 'text-zinc-400'
                }`}
              />
              <span>{t.common.starred}</span>
            </button>

            {selectedTag && (
              <button
                onClick={() => setSelectedTag(null)}
                className="px-2.5 py-1.5 rounded-lg bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs hover:bg-zinc-300"
              >
                Tag: {selectedTag} ✕
              </button>
            )}
          </div>
        </div>

        {/* Tag Pills */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-[11px] text-zinc-400 font-medium mr-1">Tags:</span>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
                  selectedTag === tag
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {/* Papers Grid */}
        {filteredPapers.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 space-y-2">
            <FileText className="w-8 h-8 mx-auto text-zinc-400" />
            <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
              {t.common.noPapersFound}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPapers.map((paper) => {
              const isCurrent = activePaper?.id === paper.id;
              return (
                <div
                  key={paper.id}
                  className={`p-5 rounded-2xl border transition-all duration-150 flex flex-col justify-between ${
                    isCurrent
                      ? 'bg-indigo-50/20 dark:bg-indigo-950/20 border-indigo-500/60 shadow-md ring-1 ring-indigo-500/20'
                      : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
                >
                  <div>
                    {/* Top row: tags and actions */}
                    <div className="flex items-start justify-between gap-3 mb-2.5">
                      <div className="flex flex-wrap gap-1">
                        {paper.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => onToggleStar(paper.id)}
                          className="p-1 rounded text-zinc-400 hover:text-amber-400 transition-colors"
                          title={paper.isStarred ? t.common.unstar : t.common.star}
                        >
                          <Star
                            className={`w-4 h-4 ${
                              paper.isStarred ? 'fill-amber-400 text-amber-400' : ''
                            }`}
                          />
                        </button>

                        <button
                          onClick={() => onDeletePaper(paper.id)}
                          className="p-1 rounded text-zinc-400 hover:text-red-500 transition-colors"
                          title={t.common.delete}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Title */}
                    <h3
                      onClick={() => {
                        onSelectPaper(paper);
                        onNavigateToTab('reader');
                      }}
                      className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition-colors mb-1.5 leading-snug"
                    >
                      {paper.title}
                    </h3>

                    {/* Authors & Year */}
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2 line-clamp-1">
                      {paper.authors} • {paper.year}
                    </p>

                    {/* Abstract snippet */}
                    <p className="text-xs text-zinc-600 dark:text-zinc-300 line-clamp-3 leading-relaxed mb-4">
                      {paper.abstract}
                    </p>
                  </div>

                  {/* Bottom Bar */}
                  <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
                    <div className="text-[11px] text-zinc-400 font-mono">
                      {paper.totalPages} {t.common.pages}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          onSelectPaper(paper);
                          onNavigateToTab('reader');
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center gap-1 transition-colors"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Chat</span>
                      </button>

                      <button
                        onClick={() => {
                          onSelectPaper(paper);
                          onNavigateToTab('summary');
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        <span>Summary</span>
                      </button>

                      {paper.summary && (
                        <button
                          onClick={() => {
                            const md = exportSummaryToMarkdown(paper);
                            downloadMarkdownFile(`${paper.title}-summary.md`, md);
                          }}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                          title="Export Markdown"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
