import React from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

/**
 * BarChart component
 * Props:
 *  - data: Array<{ name: string, y: number }>
 *  - title: string (optional)
 *  - horizontal: boolean (optional) - se true, cria barras horizontais
 */
export default function BarChart({ data = [], title = 'Gráfico de Barras', horizontal = false, showPercent = false }) {
  const [isDark, setIsDark] = React.useState(false);

  React.useEffect(() => {
    const checkDark = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const total = data.reduce((sum, item) => sum + (Number(item.y) || 0), 0);

  const textColor = isDark ? '#e2e8f0' : '#0f172a';
  const labelColor = isDark ? '#94a3b8' : '#64748b';
  const gridColor = isDark ? '#334155' : '#f1f5f9';
  const lineColor = isDark ? '#475569' : '#e2e8f0';
  const tooltipBg = isDark ? '#1e293b' : '#ffffff';
  const tooltipText = isDark ? '#f1f5f9' : '#334155';

  const options = {
    chart: {
      type: horizontal ? 'bar' : 'column',
      backgroundColor: 'transparent',
      height: 380,
      style: { fontFamily: 'Inter, system-ui, sans-serif' },
    },
    title: {
      text: title || null,
      style: { color: textColor, fontSize: '16px', fontWeight: '600' },
    },
    credits: { enabled: false },
    xAxis: {
      categories: data.map(item => item.name),
      labels: {
        style: { color: labelColor },
      },
      lineColor: lineColor,
      tickColor: lineColor,
    },
    yAxis: {
      title: {
        text: 'Quantidade',
        style: { color: labelColor },
      },
      labels: {
        style: { color: labelColor },
      },
      gridLineColor: gridColor,
    },
    tooltip: {
      pointFormatter: function() {
        const y = Number(this.y) || 0;
        if (showPercent && total > 0) {
          const pct = (y / total) * 100;
          return `<b>${y}</b> (${pct.toFixed(1)}%)`;
        }
        return `<b>${y}</b>`;
      },
      backgroundColor: tooltipBg,
      borderColor: lineColor,
      style: { color: tooltipText },
    },
    accessibility: { enabled: false },
    plotOptions: {
      column: {
        borderRadius: 4,
        colorByPoint: true,
        dataLabels: {
          enabled: true,
          formatter: function () {
            const y = Number(this.y) || 0;
            if (showPercent && total > 0) {
              const pct = (y / total) * 100;
              return `${y} (${pct.toFixed(1)}%)`;
            }
            return `${y}`;
          },
          style: { color: labelColor, textOutline: 'none' },
        },
      },
      bar: {
        borderRadius: 4,
        colorByPoint: true,
        dataLabels: {
          enabled: true,
          formatter: function () {
            const y = Number(this.y) || 0;
            if (showPercent && total > 0) {
              const pct = (y / total) * 100;
              return `${y} (${pct.toFixed(1)}%)`;
            }
            return `${y}`;
          },
          style: { color: labelColor, textOutline: 'none' },
        },
      },
    },
    colors: [
      '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444',
      '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
    ],
    series: [
      {
        name: 'Quantidade',
        data: data.map(item => item.y),
      },
    ],
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 h-full">
      <HighchartsReact highcharts={Highcharts} options={options} />
    </div>
  );
}
