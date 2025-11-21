import React from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { useChartTheme } from '../../hooks/useChartTheme';

export default function BarChart({
  data = [],
  title = 'Grafico de Barras',
  horizontal = false,
  showPercent = false,
  height = 320,
}) {
  const { colors, getBaseOptions } = useChartTheme();
  const total = data.reduce((sum, item) => sum + (Number(item.y) || 0), 0);

  const options = {
    ...getBaseOptions(),
    chart: {
      ...getBaseOptions().chart,
      type: horizontal ? 'bar' : 'column',
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
      pointFormatter: function () {
        const y = Number(this.y) || 0;
        if (showPercent && total > 0) {
          const pct = (y / total) * 100;
          return `<b>${y}</b> (${pct.toFixed(1)}%)`;
        }
        return `<b>${y}</b>`;
      },
      backgroundColor: colors.tooltipBg,
      borderColor: colors.tooltipBorder,
      style: { color: colors.tooltipText },
      borderRadius: 8,
      shadow: true,
    },
    plotOptions: {
      column: {
        borderRadius: 6,
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
          style: {
            color: colors.dataLabel,
            textOutline: 'none',
            fontSize: '11px',
            fontWeight: '500',
          },
        },
      },
      bar: {
        borderRadius: 6,
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
          style: {
            color: colors.dataLabel,
            textOutline: 'none',
            fontSize: '11px',
            fontWeight: '500',
          },
        },
      },
    },
    colors: colors.series,
    series: [
      {
        name: 'Quantidade',
        data: data.map((item) => item.y),
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
