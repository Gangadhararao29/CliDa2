import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { DashboardPageRoutingModule } from './dashboard-routing.module';
import { NgxPaginationModule } from 'ngx-pagination';

import { DashboardPage } from './dashboard.page';
import { LineChartPage } from './line-chart/line-chart.page';
import { PieChartComponent } from './pie-chart/pie-chart.component';
import { NgChartsModule } from 'ng2-charts';
import { FilterByYearPipe } from './filter-by-year.pipe';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DashboardPageRoutingModule,
    NgChartsModule,
    NgxPaginationModule,
  ],
  declarations: [DashboardPage, LineChartPage, PieChartComponent, FilterByYearPipe],
})
export class DashboardPageModule {}
