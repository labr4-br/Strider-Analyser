import { useState, useEffect, useRef, FormEvent, Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ShieldCheck } from 'lucide-react';

type ChatHelpers = {
  messages: Array<{ id: string; role: string; parts: Array<{ type: string; text?: string }> }>;
  sendMessage: (message: { text: string }) => void;
  status: string;
  suggestedQuestions?: string[];
};

const SUGGESTION_CHIPS = [
  'Como mitigar as ameaças críticas?',
  'Gere código de autenticação JWT',
  'Quais ameaças violam LGPD?',
  'Sugira testes de segurança',
];

function getMessageText(parts: Array<{ type: string; text?: string }>): string {
  return parts
    .filter((p) => p.type === 'text' && p.text)
    .map((p) => p.text)
    .join('');
}

// ── Inline markdown: **bold**, *italic*, `code` ──────────────────────────────
function InlineMd({ text }: { text: string }) {
  const tokens = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return (
    <>
      {tokens.map((tok, i) => {
        if (tok.startsWith('**') && tok.endsWith('**'))
          return <strong key={i} className="font-semibold">{tok.slice(2, -2)}</strong>;
        if (tok.startsWith('*') && tok.endsWith('*'))
          return <em key={i}>{tok.slice(1, -1)}</em>;
        if (tok.startsWith('`') && tok.endsWith('`'))
          return <code key={i} className="px-1 py-0.5 rounded text-[11px] bg-black/20 font-mono">{tok.slice(1, -1)}</code>;
        return <Fragment key={i}>{tok}</Fragment>;
      })}
    </>
  );
}

// ── Block markdown renderer ──────────────────────────────────────────────────
function MarkdownMessage({ text, isUser }: { text: string; isUser: boolean }) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];
  let listType: 'ul' | 'ol' | null = null;

  const flushList = () => {
    if (!listItems.length) return;
    if (listType === 'ul') {
      elements.push(
        <ul key={elements.length} className="space-y-0.5 pl-3 my-1">
          {listItems.map((item, i) => (
            <li key={i} className="flex gap-2">
              <span className={`mt-1 shrink-0 text-[8px] ${isUser ? 'text-indigo-200' : 'text-indigo-400'}`}>▸</span>
              <span><InlineMd text={item} /></span>
            </li>
          ))}
        </ul>
      );
    } else {
      elements.push(
        <ol key={elements.length} className="space-y-0.5 pl-3 my-1 list-decimal list-inside">
          {listItems.map((item, i) => (
            <li key={i}><InlineMd text={item} /></li>
          ))}
        </ol>
      );
    }
    listItems = [];
    listType = null;
  };

  for (const line of lines) {
    const trimmed = line.trim();

    // H2
    if (/^##\s/.test(trimmed)) {
      flushList();
      elements.push(
        <p key={elements.length} className={`text-xs font-bold uppercase tracking-wide mt-2 mb-0.5 ${isUser ? 'text-indigo-200' : 'text-indigo-500 dark:text-indigo-400'}`}>
          <InlineMd text={trimmed.replace(/^##\s+/, '')} />
        </p>
      );
      continue;
    }

    // H3
    if (/^###\s/.test(trimmed)) {
      flushList();
      elements.push(
        <p key={elements.length} className={`text-xs font-semibold mt-1.5 mb-0.5 ${isUser ? 'text-indigo-100' : 'text-gray-700 dark:text-gray-300'}`}>
          <InlineMd text={trimmed.replace(/^###\s+/, '')} />
        </p>
      );
      continue;
    }

    // Bullet
    const bullet = trimmed.match(/^[-*•]\s+(.*)/);
    if (bullet) {
      if (listType === 'ol') flushList();
      listType = 'ul';
      listItems.push(bullet[1]);
      continue;
    }

    // Numbered
    const numbered = trimmed.match(/^\d+\.\s+(.*)/);
    if (numbered) {
      if (listType === 'ul') flushList();
      listType = 'ol';
      listItems.push(numbered[1]);
      continue;
    }

    // Blank line
    if (!trimmed) {
      flushList();
      elements.push(<div key={elements.length} className="h-1.5" />);
      continue;
    }

    // Paragraph
    flushList();
    elements.push(
      <p key={elements.length} className="leading-relaxed">
        <InlineMd text={trimmed} />
      </p>
    );
  }

  flushList();
  return <div className="text-xs space-y-0.5">{elements}</div>;
}

export function ChatPanel({ messages, sendMessage, status, suggestedQuestions }: ChatHelpers) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isLoading = status === 'streaming' || status === 'submitted';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleChipClick = (chip: string) => {
    sendMessage({ text: chip });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input });
    setInput('');
  };

  return (
    <div className="flex flex-col h-[480px] bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60">
        <ShieldCheck className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Agente de segurança com acesso à análise completa</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-sm text-gray-400 dark:text-gray-500 mt-8">
            Faça perguntas sobre a análise de ameaças
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            const text = getMessageText(msg.parts);
            if (!text) return null;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] px-3 py-2.5 rounded-xl ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-none'
                  }`}
                >
                  <MarkdownMessage text={text} isUser={msg.role === 'user'} />
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Loading dots */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-xl rounded-bl-none flex gap-1 items-center">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500"
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion chips — show only when no messages yet */}
      {messages.length === 0 && (
        <div className="px-4 py-2 flex flex-wrap gap-2 border-t border-gray-100 dark:border-gray-800">
          {(suggestedQuestions && suggestedQuestions.length > 0 ? suggestedQuestions : SUGGESTION_CHIPS).map((chip) => (
            <button
              key={chip}
              onClick={() => handleChipClick(chip)}
              className="text-xs px-2.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-700 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="flex gap-2 px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pergunte sobre as ameaças..."
          disabled={isLoading}
          className="flex-1 text-sm px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-white"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
