import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { ChartConfiguration, ChartType } from 'chart.js';
import { ClientDataService } from 'src/app/services/client-data.service';

@Component({
  selector: 'app-line-chart',
  templateUrl: './line-chart.page.html',
  styleUrls: ['./line-chart.page.scss'],
})
export class LineChartPage implements OnChanges {
  @Input() responseData: [];

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
  dataArray = [];

  constructor() {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes.responseData.currentValue) {
      this.labels = [];
      this.dataSet1 = [0];
      this.dataSet2 = [0];
      this.dataArray = [];
      this.sortByYear(changes.responseData.currentValue);
    }
  }

  sortByYear(response) {
    const combinedData = [];
    const dateSet = new Set();
    response.forEach((record) => {
      record.data.data.forEach((data) => {
        combinedData.push(data);
        dateSet.add(new Date(data.startDate).getFullYear());
      });
    });

    const filteredDataForYear = {};
    dateSet.forEach((date) => {
      filteredDataForYear[`${date}`] = combinedData.filter(
        (objectData) => new Date(objectData.startDate).getFullYear() == date
      );
    });

    const filteredDataByMonth = {};
    for (const year in filteredDataForYear) {
      if (year) {
        const monthArray = (filteredDataByMonth[year] = [[], []]);
        filteredDataForYear[year].filter((element) => {
          if (new Date(element.startDate).getMonth() + 1 < 6) {
            monthArray[0].push(element);
          } else {
            monthArray[1].push(element);
          }
        });
      }
    }

    const graphObject = {};
    for (const halfYearlyData in filteredDataByMonth) {
      if (halfYearlyData) {
        graphObject[halfYearlyData] = { prin1: 0, tot1: 0, prin2: 0, tot2: 0 };
        filteredDataByMonth[halfYearlyData][0].forEach((record) => {
          graphObject[halfYearlyData].prin1 += record.principal;
          graphObject[halfYearlyData].tot1 +=
            (record.principal * record.interest) / 100.0;
        });

        filteredDataByMonth[halfYearlyData][1].forEach((record) => {
          graphObject[halfYearlyData].prin2 += record.principal;
          graphObject[halfYearlyData].tot2 +=
            (record.principal * record.interest) / 100.0;
        });
      }
    }
    this.renderGraph(graphObject);
  }

  renderGraph(graphData) {
    Object.entries(graphData).forEach((ele: any) => {
      this.labels.push(ele[0], ele[0].toString() + '-06');
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
          fill: 'start',
        },
      ],
      labels: this.labels,
    };
  }
}
