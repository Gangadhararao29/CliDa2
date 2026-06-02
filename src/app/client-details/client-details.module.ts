import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ClientDetailsPageRoutingModule } from './client-details-routing.module';

import { ClientDetailsPage } from './client-details.page';
import { ApproveModalComponent } from './approve-modal/approve-modal.component';
import { SummaryTableComponent } from './summaryTable/summary-table.component';
import { ClientDataViewComponent } from './client-data-view/client-data-view.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ClientDetailsPageRoutingModule,
  ],
  declarations: [
    ClientDetailsPage,
    ApproveModalComponent,
    SummaryTableComponent,
    ClientDataViewComponent
  ],
})
export class ClientDetailsPageModule {}
