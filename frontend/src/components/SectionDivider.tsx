interface SectionDividerProps {
  number?: number;
}

export function SectionDivider({ number }: SectionDividerProps) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
      {number != null && (
        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-800 text-[10px] font-semibold text-gray-400 dark:text-gray-500 tabular-nums shrink-0">
          {number}
        </span>
      )}
      <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
    </div>
  );
}
