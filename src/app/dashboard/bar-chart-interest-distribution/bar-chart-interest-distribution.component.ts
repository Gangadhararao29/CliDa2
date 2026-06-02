import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';

@Component({
  selector: 'app-bar-chart-interest-distribution',
  templateUrl: './bar-chart-interest-distribution.component.html',
  styleUrls: ['./bar-chart-interest-distribution.component.scss'],
  standalone: false,
})
export class BarChartInterestDistributionComponent implements OnChanges {
  @Input() rawData: any[]; // Expecting 'totalClients'

  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    locale: 'en-IN',
    scales: {
      x: {
        stacked: true,
        title: {
          display: true,
          text: 'Interest Rate %',
          color: '#909090',
        },
        ticks: { color: '#909090' },
        grid: { color: '#50505050' },
      },
      y: {
        stacked: true,
        min: 0,
        ticks: {
          color: '#909090',
          callback: (label: number) => Math.round(label / 100000) + 'L',
        },
        grid: { color: '#50505050' },
      },
    },
    plugins: {
      legend: {
        display: true,
        labels: { color: '#909090' },
      },
      title: {
        display: true,
        text: 'Interest Rate Distribution',
        color: '#909090',
        font: { size: 16 },
      },
    },
    aspectRatio: 1.2,
  };
  public barChartType: ChartType = 'bar';
  public barChartData: ChartData<'bar'>;

  constructor() {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes.rawData && changes.rawData.currentValue) {
      this.processData(changes.rawData.currentValue);
    }
  }

  processData(clients: any[]) {
    const step = 0.25;

    const distribution: Record<number, number> = {};

    const dataObject = clients
      .map((c) => c.data.data)
      .flat()
      .sort((a, b) => a.interest - b.interest);

    dataObject.forEach((rec) => {
      const bucket = Number((Math.ceil(rec.interest / step) * step).toFixed(2));

      distribution[bucket] = (distribution[bucket] ?? 0) + rec.principal;
    });

    // Sort buckets numerically
    const sortedBuckets = Object.keys(distribution)
      .map(Number)
      .sort((a, b) => a - b);

    const positiveData = sortedBuckets.map((b) =>
      distribution[b] >= 0 ? distribution[b] : 0
    );
    const negativeData = sortedBuckets.map((b) =>
      distribution[b] < 0 ? Math.abs(distribution[b]) : 0
    );

    this.barChartData = {
      labels: sortedBuckets.map((b) => b.toFixed(2)),
      datasets: [
        {
          data: positiveData,
          label: 'Credits',
          backgroundColor: '#AB47BC',
          hoverBackgroundColor: '#8E24AA',
          borderColor: '#BA68C8',
          borderWidth: 1,
        },
        {
          data: negativeData,
          label: 'Debits',
          backgroundColor: '#FFA726',
          hoverBackgroundColor: '#FB8C00',
          borderColor: '#FFB74D',
          borderWidth: 1,
        },
      ],
    };
  }
}
