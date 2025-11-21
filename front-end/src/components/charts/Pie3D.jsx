import React from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import Highcharts3DModule from 'highcharts/highcharts-3d';
import { useChartTheme } from '../../hooks/useChartTheme';

// Enable 3D module
try {
  const apply3D = Highcharts3DModule?.default || Highcharts3DModule;
  if (typeof apply3D === 'function') apply3D(Highcharts);
} catch (e) {
  console.warn('Highcharts 3D module init warning:', e);
}

export default function Pie3D({ data = [], title = 'Distribuicao de Ativos', height = 320 }) {
  const { colors, getBaseOptions } = useChartTheme();

  const options = {
    ...getBaseOptions(),
    chart: {
      ...getBaseOptions().chart,
      type: 'pie',
      options3d: { enabled: true, alpha: 45, beta: 0 },
      height,
    },
    title: {
      text: title || null,
      style: {
        color: colors.title,
        fontSize: '14px',
        fontWeight: '600',
      },
    },
    tooltip: {
      pointFormat: '<b>{point.y}</b> ({point.percentage:.1f}%)',
      backgroundColor: colors.tooltipBg,
      borderColor: colors.tooltipBorder,
      style: { color: colors.tooltipText },
      borderRadius: 8,
    },
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: 'pointer',
        depth: 35,
        dataLabels: {
          enabled: true,
          format: '<b>{point.name}</b>: {point.y}',
          style: {
            color: colors.dataLabel,
            textOutline: 'none',
            fontSize: '11px',
          },
        },
      },
    },
    colors: colors.series,
    series: [
      {
        name: 'Ativos',
        colorByPoint: true,
        data: data,
      },
    ],
  };

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
      <HighchartsReact highcharts={Highcharts} options={options} />
    </div>
  );
}
