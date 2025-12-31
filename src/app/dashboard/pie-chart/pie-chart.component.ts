import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';

@Component({
  selector: 'app-pie-chart',
  templateUrl: './pie-chart.component.html',
  styleUrls: ['./pie-chart.component.scss'],
  standalone: false,
})
export class PieChartComponent implements OnChanges {
  @Input() responseData: any[];

  public pieChartOptions: ChartConfiguration['options'] = {
    locale: 'en-IN',
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: { color: '#909090' }
      },
      title: {
        display: true,
        text: 'Portfolio Composition',
        color: '#909090',
        font: { size: 16 }
      }
    },
    aspectRatio: 1.235,
  };
  public pieChartData: ChartData<'pie', number[], string | string[]>;
  public pieChartType: ChartType = 'pie';

  constructor() { }

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
        labels: ['Credits', 'Debits'],
        datasets: [
          {
            data: [credit, -1 * debit],
            backgroundColor: ['#29B6F6', '#FF5252'],
            hoverBackgroundColor: ['#4FC3F7', '#FF8A80'],
            borderColor: '#50505050'
          },
        ],
      };
    }
  }
}
