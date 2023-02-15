import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';

@Component({
  selector: 'app-pie-chart',
  templateUrl: './pie-chart.component.html',
  styleUrls: ['./pie-chart.component.scss'],
})
export class PieChartComponent implements OnChanges {
  @Input() responseData: any[];

  public pieChartOptions: ChartConfiguration['options'] = {
    locale: 'en-IN',
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
    },
    aspectRatio: 1.235,
  };
  public pieChartData: ChartData<'pie', number[], string | string[]>;
  public pieChartType: ChartType = 'pie';

  constructor() {}

  ngOnChanges(changes: SimpleChanges) {
    if (
      JSON.stringify(changes.responseData.currentValue) !==
      JSON.stringify(changes.responseData.previousValue)
    ) {
      let debit = 0;
      let credit = 0;
      changes.responseData.currentValue.forEach((ele) => {
        if (ele.totalPrincipal > 0) {
          credit += ele.totalPrincipal;
        } else {
          debit += ele.totalPrincipal;
        }
      });

      this.pieChartData = {
        labels: ['Debits', 'Credits'],
        datasets: [
          {
            data: [-1 * debit, credit],
            backgroundColor: ['rgb(255, 99, 132)', 'rgb(54, 162, 235)'],
            hoverBackgroundColor: ['rgb(255, 80, 120)', 'rgb(45, 140, 255)'],
          },
        ],
      };
    }
  }
}
