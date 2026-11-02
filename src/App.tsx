import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { PaperLibrary } from './components/PaperLibrary';
import { PaperReaderAndChat } from './components/PaperReaderAndChat';
import { DeepSummaryView } from './components/DeepSummaryView';
import { MultiPaperComparisonView } from './components/MultiPaperComparisonView';
import { ResearchGapsView } from './components/ResearchGapsView';
import { ResearchScratchpadView } from './components/ResearchScratchpadView';
import { Paper, Language } from './types';
import {
  loadStoredPapers,
  saveStoredPapers,
  loadStoredActivePaperId,
  saveStoredActivePaperId,
  loadStoredTheme,
  saveStoredTheme,
  loadStoredLanguage,
  saveStoredLanguage,
} from './utils/storage';
import { checkServerHealth } from './services/api';
import { X, Upload, FileText, CheckCircle2 } from 'lucide-react';
import { extractTextFromPdf } from './utils/pdfExtractor';

export default function App() {
  const [papers, setPapers] = useState<Paper[]>(() => loadStoredPapers());
  const [activePaperId, setActivePaperId] = useState<string | null>(() => {
    const storedId = loadStoredActivePaperId();
    if (storedId) return storedId;
    const initialPapers = loadStoredPapers();
    return initialPapers[0]?.id || null;
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('library');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => loadStoredTheme());
  const [language, setLanguage] = useState<Language>(() => loadStoredLanguage());
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);

  // Sync theme to HTML root element
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    saveStoredTheme(theme);
  }, [theme]);

  // Sync language
  useEffect(() => {
    saveStoredLanguage(language);
  }, [language]);

  // Sync papers to local storage
  useEffect(() => {
    saveStoredPapers(papers);
  }, [papers]);

  // Sync active paper ID
  useEffect(() => {
    if (activePaperId) {
      saveStoredActivePaperId(activePaperId);
    }
  }, [activePaperId]);

  // Check backend server connection
  useEffect(() => {
    checkServerHealth().then((res) => {
      setIsBackendConnected(res.status === 'ok');
    });
  }, []);

  const activePaper = papers.find((p) => p.id === activePaperId) || papers[0] || null;

  const handleSelectPaper = (paper: Paper) => {
    setActivePaperId(paper.id);
  };

  const handleAddPaper = (newPaper: Paper) => {
    setPapers((prev) => [newPaper, ...prev]);
    setActivePaperId(newPaper.id);
  };

  const handleUpdatePaper = (updatedPaper: Paper) => {
    setPapers((prev) => prev.map((p) => (p.id === updatedPaper.id ? updatedPaper : p)));
  };

  const handleDeletePaper = (paperId: string) => {
    setPapers((prev) => prev.filter((p) => p.id !== paperId));
    if (activePaperId === paperId) {
      const remaining = papers.filter((p) => p.id !== paperId);
      setActivePaperId(remaining[0]?.id || null);
    }
  };

  const handleToggleStar = (paperId: string) => {
    setPapers((prev) =>
      prev.map((p) => (p.id === paperId ? { ...p, isStarred: !p.isStarred } : p))
    );
  };

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleToggleLanguage = (lang: Language) => {
    setLanguage(lang);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Navigation Bar */}
      <Header
        papers={papers}
        activePaper={activePaper}
        onSelectPaper={handleSelectPaper}
        onOpenUpload={() => setIsUploadModalOpen(true)}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        language={language}
        onToggleLanguage={handleToggleLanguage}
        isBackendConnected={isBackendConnected}
      />

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          papers={papers}
          activePaper={activePaper}
          onSelectPaper={handleSelectPaper}
          onOpenUpload={() => setIsUploadModalOpen(true)}
          language={language}
          onToggleStar={handleToggleStar}
        />

        {/* Center Content View Area */}
        <main className="flex-1 overflow-y-auto">
          {activeTab === 'library' && (
            <PaperLibrary
              papers={papers}
              activePaper={activePaper}
              onSelectPaper={handleSelectPaper}
              onAddPaper={handleAddPaper}
              onDeletePaper={handleDeletePaper}
              onToggleStar={handleToggleStar}
              onNavigateToTab={setActiveTab}
              language={language}
            />
          )}

          {activeTab === 'reader' && (
            <PaperReaderAndChat
              paper={activePaper}
              onUpdatePaper={handleUpdatePaper}
              language={language}
            />
          )}

          {activeTab === 'summary' && (
            <DeepSummaryView
              paper={activePaper}
              onUpdatePaper={handleUpdatePaper}
              language={language}
            />
          )}

          {activeTab === 'compare' && (
            <MultiPaperComparisonView papers={papers} language={language} />
          )}

          {activeTab === 'gaps' && (
            <ResearchGapsView papers={papers} language={language} />
          )}

          {activeTab === 'scratchpad' && (
            <ResearchScratchpadView activePaper={activePaper} language={language} />
          )}
        </main>
      </div>

      {/* Quick Upload Modal */}
      {isUploadModalOpen && (
        <UploadModal
          onClose={() => setIsUploadModalOpen(false)}
          onAddPaper={(p) => {
            handleAddPaper(p);
            setIsUploadModalOpen(false);
            setActiveTab('reader');
          }}
          language={language}
        />
      )}
    </div>
  );
}

// Quick Upload Modal Component
function UploadModal({
  onClose,
  onAddPaper,
  language,
}: {
  onClose: () => void;
  onAddPaper: (paper: Paper) => void;
  language: Language;
}) {
  const [isExtracting, setIsExtracting] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please select a valid PDF file.');
      return;
    }
    setError(null);
    setIsExtracting(true);
    try {
      const res = await extractTextFromPdf(file, (current, total) => {
        setProgress({ current, total });
      });

      const paper: Paper = {
        id: `paper-${Date.now()}`,
        title: res.title,
        authors: res.authors,
        year: res.year,
        abstract: res.abstract,
        totalPages: res.totalPages,
        fileSize: res.fileSize,
        uploadDate: new Date().toISOString(),
        pages: res.pages,
        tags: ['Uploaded', 'PDF'],
        isStarred: false,
        fileName: file.name,
      };

      onAddPaper(paper);
    } catch (err: any) {
      console.error(err);
      setError('Failed to extract text from PDF.');
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl relative animate-in zoom-in-95">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Upload className="w-4 h-4 text-indigo-500" />
            <span>Upload Research Paper</span>
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
          }}
          className="border-2 border-dashed border-zinc-300 dark:border-zinc-800 hover:border-indigo-500 rounded-xl p-8 text-center cursor-pointer transition-colors"
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'application/pdf';
            input.onchange = (e: any) => {
              if (e.target.files?.[0]) handleFile(e.target.files[0]);
            };
            input.click();
          }}
        >
          <Upload className="w-8 h-8 mx-auto text-indigo-500 mb-2" />
          <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Click or drag & drop PDF here
          </p>
          <p className="text-[11px] text-zinc-400 mt-1">PDF.js page extractor up to 50MB</p>
        </div>

        {isExtracting && (
          <div className="space-y-2 text-center text-xs text-zinc-500 animate-pulse">
            <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p>
              Extracting pages {progress?.current || 0} / {progress?.total || 1}...
            </p>
          </div>
        )}

        {error && (
          <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/40 p-2.5 rounded-lg">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
