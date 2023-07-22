import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ChartConfiguration } from 'chart.js';

@Component({
  selector: 'app-line-chart',
  templateUrl: './line-chart.page.html',
  styleUrls: ['./line-chart.page.scss'],
})
export class LineChartPage implements OnChanges {
  @Input() responseData: any[];

  public lineChartData: ChartConfiguration['data'];

  public lineChartOptions: ChartConfiguration['options'] = {
    elements: { line: { tension: 0.5 } },
    locale: 'en-IN',
    scales: {
      x: {},
      interestScale: {
        position: 'right',
        ticks: {
          color: 'green',
          callback: (label: number) => label / 1000 + 'K',
        },
        grid: { drawOnChartArea: false },
      },
      principalScale: {
        position: 'left',
        ticks: {
          color: '#36a2eb',
          callback: (label: number) => label / 100000 + 'L',
        },
      },
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
    aspectRatio: 1.2,
  };

  labels = [];
  dataSet1 = [0];
  dataSet2 = [0];
  dataArray = [];

  constructor() {}

  ngOnChanges(changes: SimpleChanges) {
    if (
      JSON.stringify(changes.responseData.currentValue) !==
      JSON.stringify(changes.responseData.previousValue)
    ) {
      this.labels = [];
      this.dataSet1 = [0];
      this.dataSet2 = [0];
      this.dataArray = [];
      this.groupByYear(changes.responseData.currentValue);
    }
  }

  groupByYear(response) {
    const yearObject = {};
    response.forEach((record) => {
      record.data.data.forEach((ele) => {
        const startDateObj = new Date(ele.startDate);
        const year = startDateObj.getFullYear();
        const month = startDateObj.getMonth() + 1;
        if (!yearObject[year]) {
          yearObject[year] = [[], []];
        }
        if (month <= 6) {
          yearObject[year][0].push(ele);
        } else {
          yearObject[year][1].push(ele);
        }
      });
    });
    this.calculateGraphData(yearObject);
  }

  calculateGraphData(yearObject) {
    const graphData = [];
    for (const fullYear in yearObject) {
      if (fullYear) {
        graphData[fullYear] = { prin1: 0, tot1: 0, prin2: 0, tot2: 0 };
        yearObject[fullYear][0].forEach((record) => {
          graphData[fullYear].prin1 += record.principal;
          graphData[fullYear].tot1 +=
            (record.principal * record.interest) / 100.0;
        });

        yearObject[fullYear][1].forEach((record) => {
          graphData[fullYear].prin2 += record.principal;
          graphData[fullYear].tot2 +=
            (record.principal * record.interest) / 100.0;
        });
      }
    }
    this.renderGraph(graphData);
  }

  renderGraph(graphData) {
    Object.entries(graphData).forEach((ele: any) => {
      this.labels.push(ele[0], ele[0].slice(2) + '-06');
      this.dataSet1.push(ele[1].prin1, ele[1].prin2);
      this.dataSet2.push(ele[1].tot1, ele[1].tot2);
    });
    this.labels.push(this.labels[this.labels.length - 2] * 1 + 1);

    for (let i = 1; i < this.dataSet2.length; i++) {
      this.dataSet2[i] += this.dataSet2[i - 1];
    }

    this.lineChartData = {
      datasets: [
        {
          data: this.dataSet1,
          label: 'Principal',
          yAxisID: 'principalScale',
          backgroundColor: 'rgba(54, 163, 235, 0.712)',
          borderColor: '#36a2eb',
          pointBackgroundColor: '#36a2eb',
          pointHoverBorderColor: '#36a2eb',
        },
        {
          data: this.dataSet2,
          label: 'Earnings',
          yAxisID: 'interestScale',
          backgroundColor: '#20ad2069',
          borderColor: 'green',
          pointBackgroundColor: 'green',
          pointHoverBorderColor: 'green',
          fill: 'start',
        },
      ],
      labels: this.labels,
    };
  }
}
