import React from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import Highcharts3DModule from 'highcharts/highcharts-3d';

// Enable 3D module with compatibility for different bundlers
try {
  const apply3D = Highcharts3DModule?.default || Highcharts3DModule;
  if (typeof apply3D === 'function') apply3D(Highcharts);
} catch (e) {
  console.warn('Highcharts 3D module init warning:', e);
}

/**
 * Pie3D chart component
 * Props:
 *  - data: Array<{ name: string, y: number }>
 *  - title: string (optional)
 */
export default function Pie3D({ data = [], title = 'Distribuição de Ativos' }) {
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
  const labelColor = isDark ? '#94a3b8' : '#334155';
  const tooltipBg = isDark ? '#1e293b' : '#ffffff';
  const tooltipText = isDark ? '#f1f5f9' : '#334155';
  const lineColor = isDark ? '#475569' : '#e2e8f0';

  const options = {
    chart: {
      type: 'pie',
      backgroundColor: 'transparent',
      options3d: { enabled: true, alpha: 45, beta: 0 },
      height: 380,
      style: { fontFamily: 'Inter, system-ui, sans-serif' },
    },
    title: {
      text: title || null,
      style: { color: textColor, fontSize: '16px', fontWeight: '600' },
    },
    credits: { enabled: false },
    tooltip: {
      pointFormat: '<b>{point.y}</b> ({point.percentage:.1f}%)',
      backgroundColor: tooltipBg,
      borderColor: lineColor,
      style: { color: tooltipText },
    },
    accessibility: { enabled: false },
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: 'pointer',
        depth: 35,
        dataLabels: {
          enabled: true,
          format: '<b>{point.name}</b>: {point.y}',
          style: { color: labelColor, textOutline: 'none' },
        },
      },
    },
    series: [
      {
        name: 'Ativos',
        colorByPoint: true,
        data: data,
      },
    ],
  };

  return (
    <div className="card p-4 h-full">
      <HighchartsReact highcharts={Highcharts} options={options} />
    </div>
  );
}
