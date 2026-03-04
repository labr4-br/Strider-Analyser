import { Fragment } from 'react';

/** Inline markdown: **bold**, *italic*, `code` */
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

/** Block markdown: headings, bullets, numbered lists, paragraphs */
export function MarkdownText({ text, className }: { text: string; className?: string }) {
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
              <span className="mt-1 shrink-0 text-[8px] text-indigo-400">▸</span>
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

    // Headings (most specific first: #### before ### before ## before #)
    const headingMatch = trimmed.match(/^(#{1,4})\s+(.*)/);
    if (headingMatch) {
      flushList();
      const level = headingMatch[1].length;
      const text = headingMatch[2];
      const styles = [
        '', // unused (0)
        'text-xs font-bold mt-2 mb-0.5 text-gray-900 dark:text-gray-100',           // H1
        'text-xs font-bold uppercase tracking-wide mt-2 mb-0.5 text-indigo-500 dark:text-indigo-400', // H2
        'text-xs font-semibold mt-1.5 mb-0.5 text-gray-800 dark:text-gray-200',     // H3
        'text-xs font-medium mt-1 mb-0.5 text-gray-700 dark:text-gray-300',         // H4
      ];
      elements.push(
        <p key={elements.length} className={styles[level]}>
          <InlineMd text={text} />
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
  return <div className={`text-xs space-y-0.5 ${className ?? ''}`}>{elements}</div>;
}
