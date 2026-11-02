import React from 'react';
import {
  Library,
  BookOpen,
  FileSpreadsheet,
  GitCompare,
  Lightbulb,
  Edit3,
  Star,
  FileText,
  Plus,
  Sparkles,
} from 'lucide-react';
import { Paper, Language } from '../types';
import { translations } from '../utils/i18n';

export type ActiveTab = 'library' | 'reader' | 'summary' | 'compare' | 'gaps' | 'scratchpad';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  papers: Paper[];
  activePaper: Paper | null;
  onSelectPaper: (paper: Paper) => void;
  onOpenUpload: () => void;
  language: Language;
  onToggleStar: (paperId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  papers,
  activePaper,
  onSelectPaper,
  onOpenUpload,
  language,
  onToggleStar,
}) => {
  const t = translations[language];

  const navItems: Array<{ id: ActiveTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'library', label: t.nav.library, icon: Library },
    { id: 'reader', label: t.nav.reader, icon: BookOpen },
    { id: 'summary', label: t.nav.summary, icon: FileSpreadsheet },
    { id: 'compare', label: t.nav.compare, icon: GitCompare },
    { id: 'gaps', label: t.nav.gaps, icon: Lightbulb },
    { id: 'scratchpad', label: t.nav.scratchpad, icon: Edit3 },
  ];

  return (
    <aside className="w-64 flex-shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/60 flex flex-col justify-between h-[calc(100vh-4rem)] select-none">
      <div className="p-3 space-y-6 overflow-y-auto">
        {/* Navigation Tabs */}
        <div>
          <div className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider px-2.5 mb-2">
            Workspace
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/50 dark:hover:bg-zinc-900/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-inherit' : 'text-zinc-500 dark:text-zinc-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Active Paper Quick Card */}
        {activePaper && (
          <div className="bg-white dark:bg-zinc-900/90 rounded-xl p-3 border border-zinc-200 dark:border-zinc-800/80 shadow-xs">
            <div className="flex items-center justify-between text-[11px] text-zinc-400 dark:text-zinc-500 font-semibold uppercase mb-1.5">
              <span>{t.common.activePaper}</span>
              <button
                onClick={() => onToggleStar(activePaper.id)}
                className="text-zinc-400 hover:text-amber-400 transition-colors"
                title={activePaper.isStarred ? t.common.unstar : t.common.star}
              >
                <Star
                  className={`w-3.5 h-3.5 ${
                    activePaper.isStarred ? 'fill-amber-400 text-amber-400' : ''
                  }`}
                />
              </button>
            </div>
            <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-2 mb-1">
              {activePaper.title}
            </h4>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mb-2">
              {activePaper.authors}
            </div>
            <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-1.5 border-t border-zinc-100 dark:border-zinc-800">
              <span>{activePaper.totalPages} {t.common.pages}</span>
              <span>{activePaper.year}</span>
            </div>
          </div>
        )}

        {/* Papers Quick List */}
        <div>
          <div className="flex items-center justify-between px-2.5 mb-2">
            <span className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
              {t.common.allPapers} ({papers.length})
            </span>
            <button
              onClick={onOpenUpload}
              className="text-zinc-500 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
              title={t.common.uploadPaper}
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
            {papers.map((p) => {
              const isSelected = activePaper?.id === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => onSelectPaper(p)}
                  className={`group px-2.5 py-1.5 rounded-lg text-xs cursor-pointer flex items-center justify-between gap-2 transition-colors ${
                    isSelected
                      ? 'bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-medium'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? 'text-indigo-500' : 'text-zinc-400'}`} />
                    <span className="truncate">{p.title}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleStar(p.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-amber-400 transition-opacity"
                  >
                    <Star className={`w-3 h-3 ${p.isStarred ? 'opacity-100 fill-amber-400 text-amber-400' : ''}`} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Branding Info */}
      <div className="p-3 border-t border-zinc-200 dark:border-zinc-800/80 text-[11px] text-zinc-400 dark:text-zinc-500 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-indigo-400" />
          <span>PaperMind AI Core</span>
        </div>
        <span className="font-mono text-[10px]">v2.4</span>
      </div>
    </aside>
  );
};
