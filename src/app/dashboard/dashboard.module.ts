import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { DashboardPageRoutingModule } from './dashboard-routing.module';
import { NgxPaginationModule } from 'ngx-pagination';

import { DashboardPage } from './dashboard.page';
import { LineChartPage } from './line-chart/line-chart.page';
import { NgChartsModule } from 'ng2-charts';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DashboardPageRoutingModule,
    NgChartsModule,
    NgxPaginationModule,
  ],
  declarations: [DashboardPage, LineChartPage],
})
export class DashboardPageModule {}
