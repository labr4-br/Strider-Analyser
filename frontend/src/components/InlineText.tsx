import { Fragment } from 'react';

interface InlineTextProps {
  content: string;
  className?: string;
}

/**
 * Renders a single line of text with inline markdown:
 * **bold**, *italic*, `code`
 */
export function InlineText({ content, className }: InlineTextProps) {
  const parts = content.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={i} className="font-semibold">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith('*') && part.endsWith('*')) {
          return (
            <em key={i} className="italic opacity-90">
              {part.slice(1, -1)}
            </em>
          );
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code
              key={i}
              className="px-1 py-0.5 rounded text-[10px] font-mono bg-gray-100 dark:bg-gray-800 text-indigo-600 dark:text-indigo-300"
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </span>
  );
}
