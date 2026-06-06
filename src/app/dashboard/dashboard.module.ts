import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { DashboardPageRoutingModule } from './dashboard-routing.module';
import { NgxPaginationModule } from 'ngx-pagination';

import { DashboardPage } from './dashboard.page';
import { LineChartPage } from './line-chart/line-chart.page';
import { PieChartComponent } from './pie-chart/pie-chart.component';
import { BarChartTopClientsComponent } from './bar-chart-top-clients/bar-chart-top-clients.component';
import { BarChartInterestDistributionComponent } from './bar-chart-interest-distribution/bar-chart-interest-distribution.component';
import { BaseChartDirective } from 'ng2-charts';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { FilterByYearPipe } from '../pipes/filter-by-year.pipe';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DashboardPageRoutingModule,
    NgxPaginationModule,
    BaseChartDirective,
    SharedModule,
  ],
  providers: [provideCharts(withDefaultRegisterables())],
  declarations: [
    DashboardPage,
    LineChartPage,
    PieChartComponent,
    BarChartTopClientsComponent,
    BarChartInterestDistributionComponent,
    FilterByYearPipe,
  ],
})
export class DashboardPageModule {}
