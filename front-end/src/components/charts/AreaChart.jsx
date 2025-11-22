import React from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

/**
 * AreaChart component
 * Props:
 *  - data: Array<{ name: string, y: number }>
 *  - title: string (optional)
 *  - stacked: boolean (optional) - se true, empilha as áreas
 */
export default function AreaChart({ data = [], title = 'Gráfico de Área', stacked = false }) {
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

  const textColor = isDark ? '#e2e8f0' : '#0f172a';
  const labelColor = isDark ? '#94a3b8' : '#64748b';
  const gridColor = isDark ? '#334155' : '#f1f5f9';
  const lineColor = isDark ? '#475569' : '#e2e8f0';
  const tooltipBg = isDark ? '#1e293b' : '#ffffff';
  const tooltipText = isDark ? '#f1f5f9' : '#334155';

  const options = {
    chart: {
      type: 'areaspline',
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
      pointFormat: '<b>{point.y}</b>',
      backgroundColor: tooltipBg,
      borderColor: lineColor,
      style: { color: tooltipText },
    },
    accessibility: { enabled: false },
    plotOptions: {
      areaspline: {
        fillOpacity: 0.3,
        marker: {
          enabled: true,
          radius: 4,
        },
        dataLabels: {
          enabled: true,
          style: { color: labelColor, textOutline: 'none' },
        },
        stacking: stacked ? 'normal' : null,
      },
    },
    series: [
      {
        name: 'Distribuição',
        data: data.map(item => item.y),
        color: '#10b981',
        fillColor: {
          linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
          stops: [
            [0, 'rgba(16, 185, 129, 0.4)'],
            [1, 'rgba(16, 185, 129, 0.1)']
          ]
        },
      },
    ],
  };

  return (
    <div className="card p-4 h-full">
      <HighchartsReact highcharts={Highcharts} options={options} />
    </div>
  );
}
