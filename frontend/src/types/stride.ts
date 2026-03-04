import { UserX, FileEdit, FileQuestion, Eye, Zap, ShieldAlert, type LucideIcon } from 'lucide-react';

export type Theme = 'dark' | 'light';

export const STRIDE_CATEGORIES: Array<{
  key: 'S' | 'T' | 'R' | 'I' | 'D' | 'E';
  fullName: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  darkBg: string;
}> = [
  { key: 'S', fullName: 'Falsificação de Identidade', icon: UserX, color: 'text-gray-400 dark:text-gray-500', bgColor: 'bg-gray-100', darkBg: 'dark:bg-gray-800/50' },
  { key: 'T', fullName: 'Adulteração', icon: FileEdit, color: 'text-gray-400 dark:text-gray-500', bgColor: 'bg-gray-100', darkBg: 'dark:bg-gray-800/50' },
  { key: 'R', fullName: 'Repúdio', icon: FileQuestion, color: 'text-gray-400 dark:text-gray-500', bgColor: 'bg-gray-100', darkBg: 'dark:bg-gray-800/50' },
  { key: 'I', fullName: 'Divulgação de Informação', icon: Eye, color: 'text-gray-400 dark:text-gray-500', bgColor: 'bg-gray-100', darkBg: 'dark:bg-gray-800/50' },
  { key: 'D', fullName: 'Negação de Serviço', icon: Zap, color: 'text-gray-400 dark:text-gray-500', bgColor: 'bg-gray-100', darkBg: 'dark:bg-gray-800/50' },
  { key: 'E', fullName: 'Elevação de Privilégio', icon: ShieldAlert, color: 'text-gray-400 dark:text-gray-500', bgColor: 'bg-gray-100', darkBg: 'dark:bg-gray-800/50' },
];
