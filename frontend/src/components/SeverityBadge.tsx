import clsx from 'clsx';

const SEVERITY_STYLES = {
  Critical: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  High: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  Medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  Low: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
};

export function SeverityBadge({ severity }: { severity: 'Critical' | 'High' | 'Medium' | 'Low' }) {
  return (
    <span className={clsx('px-2 py-0.5 rounded-full text-xs font-semibold', SEVERITY_STYLES[severity])}>
      {severity}
    </span>
  );
}
