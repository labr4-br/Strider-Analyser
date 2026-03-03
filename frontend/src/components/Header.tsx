import { PanelLeft, KeyRound } from 'lucide-react';
import { Theme } from '../types/stride';
import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
  theme: Theme;
  sidebarOpen: boolean;
  isConfigured: boolean;
  onThemeChange: (t: Theme) => void;
  onSidebarToggle: () => void;
  onSettingsOpen: () => void;
}

export function Header({ theme, sidebarOpen, isConfigured, onThemeChange, onSidebarToggle, onSettingsOpen }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm">
      <div className="px-3 h-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={onSidebarToggle}
            className={`p-1 rounded-md transition-colors ${
              sidebarOpen
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
            title="Toggle histórico"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-semibold tracking-wide text-gray-700 dark:text-gray-300">
            STRIDE Analyser
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onSettingsOpen}
            className={`p-1 rounded-md transition-colors relative ${
              isConfigured
                ? 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                : 'text-amber-500 hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-300'
            }`}
            title="Configurações do LLM"
          >
            <KeyRound className="w-3.5 h-3.5" />
            {!isConfigured && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            )}
          </button>
          <ThemeToggle theme={theme} onChange={onThemeChange} />
        </div>
      </div>
    </header>
  );
}
