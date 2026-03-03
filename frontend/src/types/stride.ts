export type Theme = 'dark' | 'light';

export const STRIDE_CATEGORIES: Array<{
  key: 'S' | 'T' | 'R' | 'I' | 'D' | 'E';
  fullName: string;
  color: string;
  bgColor: string;
  darkBg: string;
}> = [
  { key: 'S', fullName: 'Falsificação de Identidade', color: 'text-red-400', bgColor: 'bg-red-50', darkBg: 'dark:bg-red-950/30' },
  { key: 'T', fullName: 'Adulteração', color: 'text-orange-400', bgColor: 'bg-orange-50', darkBg: 'dark:bg-orange-950/30' },
  { key: 'R', fullName: 'Repúdio', color: 'text-yellow-400', bgColor: 'bg-yellow-50', darkBg: 'dark:bg-yellow-950/30' },
  { key: 'I', fullName: 'Divulgação de Informação', color: 'text-blue-400', bgColor: 'bg-blue-50', darkBg: 'dark:bg-blue-950/30' },
  { key: 'D', fullName: 'Negação de Serviço', color: 'text-purple-400', bgColor: 'bg-purple-50', darkBg: 'dark:bg-purple-950/30' },
  { key: 'E', fullName: 'Elevação de Privilégio', color: 'text-green-400', bgColor: 'bg-green-50', darkBg: 'dark:bg-green-950/30' },
];
