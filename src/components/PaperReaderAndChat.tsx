import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  BookOpen,
  Quote,
  Search,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  Download,
  RotateCcw,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { Paper, ChatMessage, Citation, Language } from '../types';
import { translations } from '../utils/i18n';
import { askPaperQuestion } from '../services/api';
import { CitationInspectorModal } from './CitationInspectorModal';
import { downloadMarkdownFile } from '../utils/storage';

interface PaperReaderAndChatProps {
  paper: Paper | null;
  onUpdatePaper: (paper: Paper) => void;
  language: Language;
}

export const PaperReaderAndChat: React.FC<PaperReaderAndChatProps> = ({
  paper,
  onUpdatePaper,
  language,
}) => {
  const t = translations[language];

  // Viewer State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSearchTerm, setPageSearchTerm] = useState('');

  // Chat State
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [chatLanguage, setChatLanguage] = useState<Language>(language);

  // Inspector State
  const [inspectedCitation, setInspectedCitation] = useState<Citation | null>(null);
  const [inspectedPage, setInspectedPage] = useState<number | undefined>(undefined);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const messages: ChatMessage[] = paper?.chatHistory || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  if (!paper) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] p-8 text-center text-zinc-500">
        <BookOpen className="w-12 h-12 mb-3 text-zinc-400" />
        <h3 className="text-base font-bold text-zinc-700 dark:text-zinc-300 mb-1">
          No Paper Selected
        </h3>
        <p className="text-xs max-w-sm">
          Please select a research paper from your library or upload a new PDF to start reading and chatting.
        </p>
      </div>
    );
  }

  const activePageData = paper.pages.find((p) => p.pageNumber === currentPage) || paper.pages[0];

  // Suggested inquiries
  const suggestedQuestions = language === 'th' ? [
    'อธิบายสถาปัตยกรรมหลักและสมการสำคัญของงานวิจัยนี้',
    'ชุดข้อมูลและผลการทดลองเปรียบเทียบกับ Baseline ใดบ้าง?',
    'ข้อจำกัดและสมมติฐานที่ผู้วิจัยระบุไว้มีอะไรบ้าง?',
    'งานนี้สร้างความก้าวหน้าเหนือกว่างานเดิมอย่างไร?',
  ] : [
    'Explain the core architecture and fundamental equations',
    'What baselines and benchmarks were evaluated against?',
    'What critical limitations and assumptions are stated?',
    'How does this work overcome previous bottlenecks?',
  ];

  const handleSendMessage = async (queryToSend?: string) => {
    const query = queryToSend || inputText.trim();
    if (!query || isSending) return;

    setInputText('');
    setChatError(null);

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toISOString(),
    };

    const newHistory = [...messages, userMessage];

    // Optimistically update
    const updatedPaper = {
      ...paper,
      chatHistory: newHistory,
    };
    onUpdatePaper(updatedPaper);
    setIsSending(true);

    try {
      const response = await askPaperQuestion(
        paper,
        query,
        newHistory,
        chatLanguage
      );

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: response.answer,
        timestamp: new Date().toISOString(),
        citations: response.citations,
        suggestedFollowUps: response.suggestedFollowUps,
      };

      onUpdatePaper({
        ...paper,
        chatHistory: [...newHistory, assistantMessage],
      });
    } catch (err: any) {
      console.error('Chat error:', err);
      setChatError(err?.message || 'Failed to get an answer. Please verify network and try again.');
    } finally {
      setIsSending(false);
    }
  };

  const openInspectorForCitation = (citation: Citation) => {
    setInspectedCitation(citation);
    setInspectedPage(citation.page);
    setCurrentPage(citation.page);
    setIsInspectorOpen(true);
  };

  const openInspectorForPage = (pageNumber: number) => {
    setInspectedCitation(null);
    setInspectedPage(pageNumber);
    setCurrentPage(pageNumber);
    setIsInspectorOpen(true);
  };

  const handleExportChat = () => {
    if (messages.length === 0) return;
    let md = `# Research Chat Transcript: ${paper.title}\n\n`;
    md += `**Date**: ${new Date().toLocaleString()}\n\n---\n\n`;
    messages.forEach((m) => {
      md += `### ${m.role === 'user' ? '👤 Researcher' : '🧠 PaperMind AI'}\n\n${m.content}\n\n`;
      if (m.citations && m.citations.length > 0) {
        md += `*Verified Citations:*\n`;
        m.citations.forEach((c) => {
          md += `- **Page ${c.page}**: "${c.quote}"\n`;
        });
        md += `\n`;
      }
    });
    downloadMarkdownFile(`${paper.title}-chat-transcript.md`, md);
  };

  // Helper to parse text and turn [Page X] or [Page X, Y] into clickable interactive pills
  const renderMessageContent = (content: string) => {
    // Regex matching [Page 1], [Page 2, 3], [Page 4]
    const regex = /\[(?:Page|หน้า)\s*(\d+(?:\s*,\s*\d+)*)\]/gi;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(content)) !== null) {
      // Add text before match
      if (match.index > lastIndex) {
        parts.push(content.substring(lastIndex, match.index));
      }

      const pagesStr = match[1];
      const pageNumbers = pagesStr.split(',').map((s) => parseInt(s.trim(), 10)).filter(Boolean);

      parts.push(
        <span key={match.index} className="inline-flex items-center gap-1 mx-1 my-0.5">
          {pageNumbers.map((pg) => (
            <button
              key={pg}
              onClick={() => openInspectorForPage(pg)}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-950/80 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-mono text-[11px] font-semibold border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer"
              title={`Jump to Page ${pg}`}
            >
              <ExternalLink className="w-2.5 h-2.5" />
              <span>Page {pg}</span>
            </button>
          ))}
        </span>
      );

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }

    return (
      <div className="whitespace-pre-wrap leading-relaxed space-y-2 text-xs sm:text-sm">
        {parts.map((p, idx) => (typeof p === 'string' ? <span key={idx}>{p}</span> : p))}
      </div>
    );
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col lg:flex-row overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      {/* LEFT PANE: Document Excerpt & Page Browser */}
      <div className="w-full lg:w-1/2 flex flex-col border-b lg:border-b-0 lg:border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 h-1/2 lg:h-full">
        {/* Document Header Bar */}
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3 bg-zinc-50/70 dark:bg-zinc-950/70 flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 rounded-lg bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                {paper.title}
              </h2>
              <div className="text-[11px] text-zinc-500 truncate">
                {paper.authors}
              </div>
            </div>
          </div>

          {/* Page Navigator */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-1 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <select
              value={currentPage}
              onChange={(e) => setCurrentPage(parseInt(e.target.value, 10))}
              className="text-xs font-mono font-medium px-2 py-1 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300"
            >
              {paper.pages.map((p) => (
                <option key={p.pageNumber} value={p.pageNumber}>
                  Page {p.pageNumber} / {paper.totalPages}
                </option>
              ))}
            </select>

            <button
              onClick={() => setCurrentPage((p) => Math.min(paper.totalPages, p + 1))}
              disabled={currentPage >= paper.totalPages}
              className="p-1 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Page Content View */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 font-sans">
          <div className="max-w-2xl mx-auto bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-400 font-mono">
              <span>PAGE {currentPage}</span>
              <span>{paper.title.slice(0, 30)}...</span>
            </div>

            <div className="whitespace-pre-wrap text-xs sm:text-sm leading-relaxed text-zinc-800 dark:text-zinc-200 font-sans">
              {activePageData?.text || 'No text extracted on this page.'}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANE: Chat with Verified Citations */}
      <div className="w-full lg:w-1/2 flex flex-col bg-zinc-50 dark:bg-zinc-950 h-1/2 lg:h-full">
        {/* Chat Header */}
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-zinc-900/60 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {t.chat.title}
              </h3>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                {t.chat.groundingNotice}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language toggle for response */}
            <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5 text-[11px]">
              <button
                onClick={() => setChatLanguage('en')}
                className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                  chatLanguage === 'en'
                    ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs'
                    : 'text-zinc-500'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setChatLanguage('th')}
                className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                  chatLanguage === 'th'
                    ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs'
                    : 'text-zinc-500'
                }`}
              >
                ไทย
              </button>
            </div>

            {messages.length > 0 && (
              <button
                onClick={handleExportChat}
                className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                title="Export Chat to Markdown"
              >
                <Download className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {messages.length === 0 ? (
            <div className="py-8 space-y-6">
              <div className="text-center space-y-1.5">
                <div className="w-10 h-10 mx-auto rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {t.chat.title}
                </h4>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                  {t.chat.subtitle}
                </p>
              </div>

              {/* Prompt Suggestions */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 px-1">
                  {t.chat.suggestedQuestions}
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {suggestedQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(q)}
                      className="text-left p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-indigo-500 dark:hover:border-indigo-500 text-xs text-zinc-700 dark:text-zinc-300 font-medium transition-all hover:translate-x-0.5"
                    >
                      💡 {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            messages.map((message) => {
              const isUser = message.role === 'user';
              return (
                <div
                  key={message.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-2`}
                >
                  <div
                    className={`max-w-[90%] rounded-2xl p-4 text-xs sm:text-sm ${
                      isUser
                        ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-br-xs shadow-xs'
                        : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-bl-xs shadow-xs'
                    }`}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    ) : (
                      renderMessageContent(message.content)
                    )}
                  </div>

                  {/* Assistant Evidence Snippets Card */}
                  {!isUser && message.citations && message.citations.length > 0 && (
                    <div className="w-full max-w-[90%] bg-zinc-100/80 dark:bg-zinc-900/40 rounded-xl p-3 border border-zinc-200 dark:border-zinc-800/80 space-y-2">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                        <Quote className="w-3 h-3 text-indigo-500" />
                        <span>{t.chat.citationsTitle}</span>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {message.citations.map((c, i) => (
                          <div
                            key={i}
                            onClick={() => openInspectorForCitation(c)}
                            className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 cursor-pointer hover:border-indigo-400 transition-colors"
                          >
                            <div className="flex items-center justify-between text-[10px] font-mono font-semibold text-indigo-600 dark:text-indigo-400 mb-1">
                              <span>Page {c.page}</span>
                              <span className="text-zinc-400 font-sans text-[10px]">Click to inspect</span>
                            </div>
                            <p className="text-[11px] italic text-zinc-600 dark:text-zinc-300 line-clamp-2">
                              "{c.quote}"
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggested Followups */}
                  {!isUser && message.suggestedFollowUps && message.suggestedFollowUps.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {message.suggestedFollowUps.map((fu, fidx) => (
                        <button
                          key={fidx}
                          onClick={() => handleSendMessage(fu)}
                          className="text-[11px] px-2.5 py-1 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 transition-colors"
                        >
                          → {fu}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}

          {isSending && (
            <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 animate-pulse">
              <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <span>Verifying paper pages & synthesizing answer with Gemini 3.8 Flash...</span>
            </div>
          )}

          {chatError && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{chatError}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 flex-shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={t.chat.placeholder}
              disabled={isSending}
              className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isSending}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-40 active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.chat.send}</span>
            </button>
          </form>
        </div>
      </div>

      {/* Verified Citation / Page Modal Inspector */}
      <CitationInspectorModal
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        citation={inspectedCitation}
        paper={paper}
        initialPage={inspectedPage}
      />
    </div>
  );
};
