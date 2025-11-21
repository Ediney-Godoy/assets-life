import React from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { useChartTheme } from '../../hooks/useChartTheme';

export default function DonutChart({
  data = [],
  title = 'Grafico Donut',
  centerText = '',
  height = 320,
}) {
  const { colors, getBaseOptions } = useChartTheme();
  const total = data.reduce((sum, item) => sum + item.y, 0);

  const options = {
    ...getBaseOptions(),
    chart: {
      ...getBaseOptions().chart,
      type: 'pie',
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
        innerSize: '60%',
        dataLabels: {
          enabled: true,
          format: '<b>{point.name}</b>: {point.y}',
          style: {
            color: colors.dataLabel,
            textOutline: 'none',
            fontSize: '11px',
          },
          distance: 20,
        },
        showInLegend: true,
        borderWidth: 0,
      },
    },
    legend: {
      align: 'right',
      verticalAlign: 'middle',
      layout: 'vertical',
      itemStyle: { color: colors.label },
    },
    colors: colors.series,
    series: [
      {
        name: 'Distribuicao',
        colorByPoint: true,
        data: data,
      },
    ],
  };

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 relative">
      <HighchartsReact highcharts={Highcharts} options={options} />
      {centerText && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{total}</div>
            <div className="text-sm text-neutral-500 dark:text-neutral-400">{centerText}</div>
          </div>
        </div>
      )}
    </div>
  );
}
