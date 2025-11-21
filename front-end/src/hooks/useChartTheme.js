import { useTheme } from '../theme/ThemeProvider';

export function useChartTheme() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return {
    isDark,
    colors: {
      // Chart colors - Modern palette
      series: [
        '#3b82f6', // blue-500
        '#8b5cf6', // violet-500
        '#10b981', // emerald-500
        '#f59e0b', // amber-500
        '#ef4444', // red-500
        '#06b6d4', // cyan-500
        '#84cc16', // lime-500
        '#f97316', // orange-500
        '#ec4899', // pink-500
        '#6366f1', // indigo-500
      ],
      // Text colors
      title: isDark ? '#f8fafc' : '#0f172a',
      label: isDark ? '#94a3b8' : '#64748b',
      dataLabel: isDark ? '#e2e8f0' : '#334155',
      // Background & borders
      background: 'transparent',
      gridLine: isDark ? '#334155' : '#f1f5f9',
      borderColor: isDark ? '#475569' : '#e2e8f0',
      // Tooltip
      tooltipBg: isDark ? '#1e293b' : '#ffffff',
      tooltipBorder: isDark ? '#475569' : '#e2e8f0',
      tooltipText: isDark ? '#f1f5f9' : '#334155',
    },
    getBaseOptions: () => ({
      chart: {
        backgroundColor: 'transparent',
        style: { fontFamily: 'Inter, system-ui, sans-serif' },
      },
      credits: { enabled: false },
      accessibility: { enabled: false },
    }),
  };
}

export default useChartTheme;
