import React from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

/**
 * StackedBarChart component
 * Props:
 *  - data: Array<{ name: string, series: Array<{ name: string, data: number[] }> }>
 *  - categories: Array<string> - categorias do eixo X
 *  - title: string (optional)
 *  - horizontal: boolean (optional) - se true, cria barras horizontais
 */
export default function StackedBarChart({ 
  data = [], 
  categories = [], 
  title = 'Gráfico de Barras Empilhadas', 
  horizontal = false 
}) {
  const options = {
    chart: {
      type: horizontal ? 'bar' : 'column',
      backgroundColor: 'transparent',
      height: 380,
      style: { fontFamily: 'Inter, system-ui, sans-serif' },
    },
    title: {
      text: title || null,
      style: { color: '#0f172a', fontSize: '16px', fontWeight: '600' },
    },
    credits: { enabled: false },
    xAxis: {
      categories: categories,
      labels: {
        style: { color: '#64748b' },
      },
      lineColor: '#e2e8f0',
      tickColor: '#e2e8f0',
    },
    yAxis: {
      min: 0,
      title: {
        text: 'Quantidade',
        style: { color: '#64748b' },
      },
      labels: {
        style: { color: '#64748b' },
      },
      gridLineColor: '#f1f5f9',
      stackLabels: {
        enabled: true,
        style: {
          fontWeight: 'bold',
          color: '#334155',
        },
      },
    },
    tooltip: {
      headerFormat: '<b>{point.x}</b><br/>',
      pointFormat: '{series.name}: {point.y}<br/>Total: {point.stackTotal}',
      backgroundColor: '#ffffff',
      borderColor: '#e2e8f0',
      style: { color: '#334155' },
    },
    accessibility: { enabled: false },
    plotOptions: {
      column: {
        stacking: 'normal',
        borderRadius: 2,
        dataLabels: {
          enabled: true,
          style: { color: '#ffffff', textOutline: '1px contrast' },
        },
      },
      bar: {
        stacking: 'normal',
        borderRadius: 2,
        dataLabels: {
          enabled: true,
          style: { color: '#ffffff', textOutline: '1px contrast' },
        },
      },
    },
    colors: [
      '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444',
      '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
    ],
    series: data,
  };

  return (
    <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
      <HighchartsReact highcharts={Highcharts} options={options} />
    </div>
  );
}