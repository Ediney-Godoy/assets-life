import React from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { useChartTheme } from '../../hooks/useChartTheme';

export default function AreaChart({
  data = [],
  title = 'Grafico de Area',
  stacked = false,
  height = 320,
}) {
  const { colors, getBaseOptions } = useChartTheme();

  const options = {
    ...getBaseOptions(),
    chart: {
      ...getBaseOptions().chart,
      type: 'areaspline',
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
    xAxis: {
      categories: data.map((item) => item.name),
      labels: {
        style: { color: colors.label, fontSize: '11px' },
      },
      lineColor: colors.borderColor,
      tickColor: colors.borderColor,
    },
    yAxis: {
      title: {
        text: 'Quantidade',
        style: { color: colors.label, fontSize: '11px' },
      },
      labels: {
        style: { color: colors.label, fontSize: '11px' },
      },
      gridLineColor: colors.gridLine,
    },
    tooltip: {
      pointFormat: '<b>{point.y}</b>',
      backgroundColor: colors.tooltipBg,
      borderColor: colors.tooltipBorder,
      style: { color: colors.tooltipText },
      borderRadius: 8,
    },
    plotOptions: {
      areaspline: {
        fillOpacity: 0.3,
        marker: {
          enabled: true,
          radius: 4,
        },
        dataLabels: {
          enabled: true,
          style: {
            color: colors.dataLabel,
            textOutline: 'none',
            fontSize: '11px',
          },
        },
        stacking: stacked ? 'normal' : null,
      },
    },
    series: [
      {
        name: 'Distribuicao',
        data: data.map((item) => item.y),
        color: '#10b981',
        fillColor: {
          linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
          stops: [
            [0, 'rgba(16, 185, 129, 0.4)'],
            [1, 'rgba(16, 185, 129, 0.05)'],
          ],
        },
      },
    ],
    legend: {
      enabled: false,
    },
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
      <HighchartsReact highcharts={Highcharts} options={options} />
    </div>
  );
}
