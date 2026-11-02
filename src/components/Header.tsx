import React from 'react';
import {
  FileText,
  Moon,
  Sun,
  Globe,
  Upload,
  Sparkles,
  BookOpen,
  ChevronDown,
} from 'lucide-react';
import { Paper, Language } from '../types';
import { translations } from '../utils/i18n';

interface HeaderProps {
  papers: Paper[];
  activePaper: Paper | null;
  onSelectPaper: (paper: Paper) => void;
  onOpenUpload: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  language: Language;
  onToggleLanguage: (lang: Language) => void;
  isBackendConnected: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  papers,
  activePaper,
  onSelectPaper,
  onOpenUpload,
  theme,
  onToggleTheme,
  language,
  onToggleLanguage,
  isBackendConnected,
}) => {
  const t = translations[language];

  return (
    <header className="h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 transition-colors">
      {/* Left: Brand & Active Paper */}
      <div className="flex items-center gap-4 sm:gap-6 min-w-0">
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 p-0.5 shadow-md shadow-indigo-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-zinc-900 rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-zinc-900 dark:text-zinc-100">
                PaperMind <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500 font-extrabold">AI</span>
              </span>
              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                Gemini 3.8
              </span>
            </div>
          </div>
        </div>

        {/* Paper Selector Dropdown */}
        {papers.length > 0 && (
          <div className="relative group hidden md:block">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300 max-w-xs cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
              <BookOpen className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
              <span className="truncate">
                {activePaper ? activePaper.title : t.common.selectPaper}
              </span>
              <ChevronDown className="w-3 h-3 text-zinc-400 flex-shrink-0" />
            </div>

            {/* Dropdown Menu */}
            <div className="absolute top-full left-0 mt-1.5 w-72 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl p-1.5 hidden group-hover:block group-focus-within:block z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 px-2 py-1">
                {t.common.allPapers} ({papers.length})
              </div>
              <div className="max-h-60 overflow-y-auto space-y-0.5">
                {papers.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => onSelectPaper(p)}
                    className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between gap-2 transition-colors ${
                      activePaper?.id === p.id
                        ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-semibold'
                        : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                    }`}
                  >
                    <span className="truncate">{p.title}</span>
                    <span className="text-[10px] text-zinc-400 flex-shrink-0">
                      {p.totalPages}p
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right: Actions & Preferences */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Backend health pill */}
        <div className="hidden lg:flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400">
          <span
            className={`w-2 h-2 rounded-full ${
              isBackendConnected ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-amber-500'
            }`}
          />
          <span className="font-medium">
            {isBackendConnected ? 'Gemini Engine Active' : 'Connecting Engine'}
          </span>
        </div>

        {/* Upload Button */}
        <button
          onClick={onOpenUpload}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-xs font-semibold shadow-sm transition-all active:scale-95"
        >
          <Upload className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t.common.uploadPaper}</span>
        </button>

        {/* Language Switcher */}
        <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 rounded-lg p-0.5 border border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => onToggleLanguage('en')}
            className={`px-2 py-1 rounded-md text-xs font-medium transition-all ${
              language === 'en'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
            title="English"
          >
            EN
          </button>
          <button
            onClick={() => onToggleLanguage('th')}
            className={`px-2 py-1 rounded-md text-xs font-medium transition-all ${
              language === 'th'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
            title="ภาษาไทย"
          >
            ไทย
          </button>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          aria-label="Toggle theme"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 transition-colors"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-zinc-700" />
          )}
        </button>
      </div>
    </header>
  );
};
