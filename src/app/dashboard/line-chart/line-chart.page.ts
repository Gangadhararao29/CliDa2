import { Component, Input, OnInit } from '@angular/core';
import { ChartConfiguration, ChartType } from 'chart.js';

@Component({
  selector: 'app-line-chart',
  templateUrl: './line-chart.page.html',
  styleUrls: ['./line-chart.page.scss'],
})
export class LineChartPage implements OnInit {
  @Input() graphData: any;

  public lineChartData: ChartConfiguration['data'];

  public lineChartOptions: ChartConfiguration['options'] = {
    elements: {
      line: {
        tension: 0.5,
      },
    },
    scales: {
      x: {},
      interestScale: {
        position: 'right',
        ticks: {
          color: 'green',
          callback: (label: number) => label / 1000 + 'k',
        },
      },
      principalScale: {
        position: 'left',
        ticks: {
          color: 'blue',
          callback: (label: number) => label / 100000 + 'L',
        },
      },
    },
    interaction: {
      mode: 'index',
    },
  };

  public lineChartType: ChartType = 'line';
  labels = [];
  dataSet1 = [0];
  dataSet2 = [0];
  // dataSet3 = [0];

  constructor() {}

  ngOnInit() {
    Object.entries(this.graphData).forEach((ele: any) => {
      this.labels.push(ele[0], ele[0].toString() + '-06');
      this.dataSet1.push(ele[1].prin1, ele[1].prin2);
      this.dataSet2.push(ele[1].tot1, ele[1].tot2);
    });

    this.labels.push(this.labels[this.labels.length - 2] * 1 + 1);

    for (let i = 1; i < this.dataSet2.length; i++) {
      this.dataSet2[i] += this.dataSet2[i - 1];
    }

    // for (let i = 1; i < this.dataSet1.length; i++) {
    //   this.dataSet3[i] = this.dataSet3[i - 1] + this.dataSet1[i];
    // }

    this.lineChartData = {
      datasets: [
        {
          data: this.dataSet1,
          label: 'Principal',
          yAxisID: 'principalScale',
          backgroundColor: 'rgba(148,159,177,0.2)',
          borderColor: 'blue',
          pointBackgroundColor: 'blue',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgba(148,159,177,0.8)',
          // fill: 'origin',
        },
        {
          data: this.dataSet2,
          label: 'Interest',
          yAxisID: 'interestScale',
          backgroundColor: '#20ad2069',
          borderColor: 'green',
          pointBackgroundColor: 'green',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'green',
          fill:'start'
        },
      ],
      labels: this.labels,
    };
  }
}
