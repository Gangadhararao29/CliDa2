import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';

@Component({
  selector: 'app-bar-chart-top-clients',
  templateUrl: './bar-chart-top-clients.component.html',
  styleUrls: ['./bar-chart-top-clients.component.scss'],
  standalone: false,
})
export class BarChartTopClientsComponent implements OnChanges {
  @Input() responseData: any[];

  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    locale: 'en-IN',
    scales: {
      x: {
        stacked: true,
        ticks: { color: '#909090' },
        grid: { color: '#50505050' }
      },
      y: {
        stacked: true,
        min: 0,
        ticks: {
          color: '#909090',
          callback: (label: number) => Math.round(label / 100000) + 'L',
        },
        grid: { color: '#50505050' }
      },
    },
    plugins: {
      legend: {
        display: true,
        labels: { color: '#909090' }
      },
      title: {
        display: true,
        text: 'Top Clients by Principal',
        color: '#909090',
        font: { size: 16 }
      }
    },
    aspectRatio: 1.2,
  };
  public barChartType: ChartType = 'bar';
  public barChartData: ChartData<'bar'>;

  constructor() { }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.responseData && changes.responseData.currentValue) {
      this.processData(changes.responseData.currentValue);
    }
  }

  processData(data: any[]) {
    // Sort by absolute principal value (descending) and take top 5
    const topClients = [...data]
      .sort((a, b) => Math.abs(b.totalPrincipal) - Math.abs(a.totalPrincipal))
      .slice(0, 5);

    const positiveData = topClients.map(c => c.totalPrincipal >= 0 ? c.totalPrincipal : 0);
    const negativeData = topClients.map(c => c.totalPrincipal < 0 ? Math.abs(c.totalPrincipal) : 0);

    this.barChartData = {
      labels: topClients.map((c) => c.name),
      datasets: [
        {
          data: positiveData,
          label: 'Credits',
          backgroundColor: '#26A69A',
          hoverBackgroundColor: '#00897B',
          borderColor: '#4DB6AC',
          borderWidth: 1
        },
        {
          data: negativeData,
          label: 'Debits',
          backgroundColor: '#EC407A',
          hoverBackgroundColor: '#D81B60',
          borderColor: '#F48FB1',
          borderWidth: 1
        },
      ],
    };
  }
}
