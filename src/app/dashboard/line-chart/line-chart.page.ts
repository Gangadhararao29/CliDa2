import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ChartConfiguration } from 'chart.js';

@Component({
  selector: 'app-line-chart',
  templateUrl: './line-chart.page.html',
  styleUrls: ['./line-chart.page.scss'],
  standalone: false,
})
export class LineChartPage implements OnChanges {
  @Input() responseData: any[];

  public lineChartData: ChartConfiguration['data'];

  public lineChartOptions: ChartConfiguration['options'] = {
    elements: { line: { tension: 0.5 } },
    locale: 'en-IN',
    scales: {
      principalScale: {
        position: 'left',
        ticks: {
          color: '#909090',
          callback: (label: number) => Math.round(label / 100000) + 'L',
        },
        grid: {
          color: '#50505050'
        }
      },
      x: {
        ticks: { color: '#909090' },
        grid: { color: '#50505050' }
      }
    },
    plugins: {
      title: {
        display: true,
        text: 'Cash Flow Trends',
        color: '#909090',
        font: { size: 16 }
      },
      legend: {
        labels: { color: '#909090' }
      }
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
    aspectRatio: 1.2,
  };

  labels = [];
  dataSet1 = [];
  dataSet2 = [];
  dataArray = [];

  constructor() { }

  ngOnChanges(changes: SimpleChanges) {
    if (
      JSON.stringify(changes.responseData.currentValue) !==
      JSON.stringify(changes.responseData.previousValue)
    ) {
      this.labels = [];
      this.dataSet1 = [];
      this.dataSet2 = [];
      this.dataArray = [];
      this.groupByYear(changes.responseData.currentValue);
    }
  }

  groupByYear(response, halfYearly = false) {
    const yearObject = {};
    response.forEach((record) => {
      record.data.data.forEach((ele) => {
        const startDateObj = new Date(ele.startDate);
        const year = startDateObj.getFullYear();
        const month = startDateObj.getMonth() + 1;

        if (!yearObject[year]) {
          yearObject[year] = [[], []];
        }

        if (halfYearly) {
          if (month <= 6) {
            yearObject[year][0].push(ele);
          } else {
            yearObject[year][1].push(ele);
          }
        } else {
          yearObject[year][0].push(ele);
        }
      });
    });
    this.calculateGraphData(yearObject, halfYearly);
  }

  calculateGraphData(yearObject, halfYearly) {
    const graphData = [];
    for (const fullYear in yearObject) {
      if (fullYear) {
        graphData[fullYear] = { prin1: 0, tot1: 0, prin2: 0, tot2: 0 };
        yearObject[fullYear][0].forEach((record) => {
          if (record.principal > 0) {
            graphData[fullYear].prin1 += record.principal;
          } else {
            graphData[fullYear].tot1 += Math.abs(record.principal);
          }
        });

        if (halfYearly) {
          yearObject[fullYear][1].forEach((record) => {
            if (record.principal > 0) {
              graphData[fullYear].prin2 += record.principal;
            } else {
              graphData[fullYear].tot2 += Math.abs(record.principal);
            }
          });
        }
      }
    }
    this.renderGraph(graphData, halfYearly);
  }

  renderGraph(graphData, halfYearly) {
    if (halfYearly) {
      Object.entries(graphData).forEach((ele: any) => {
        this.labels.push(ele[0], ele[0].slice(2) + '-06');
        this.dataSet1.push(ele[1].prin1, ele[1].prin2);
        this.dataSet2.push(ele[1].tot1, ele[1].tot2);
      });
    } else {
      Object.entries(graphData).forEach((ele: any) => {
        this.labels.push(ele[0]);
        this.dataSet1.push(ele[1].prin1);
        this.dataSet2.push(ele[1].tot1);
      });
    }

    if (this.dataSet1[0] == 0 && this.dataSet2[0] == 0) {
      this.dataSet1.shift();
      this.dataSet2.shift();
      this.labels.shift();
    }

    this.lineChartData = {
      datasets: [
        {
          data: this.dataSet1,
          label: 'Credits',
          yAxisID: 'principalScale',
          backgroundColor: '#29B6F6',
          borderColor: '#29B6F6',
          pointBackgroundColor: '#29B6F6',
          pointHoverBorderColor: '#81D4FA',
        },
        {
          data: this.dataSet2,
          label: 'Debits',
          yAxisID: 'principalScale',
          backgroundColor: '#FF5252',
          borderColor: '#FF5252',
          pointBackgroundColor: '#FF5252',
          pointHoverBorderColor: '#FF8A80',
          fill: 'start',
        },
      ],
      labels: this.labels,
    };
  }
}
