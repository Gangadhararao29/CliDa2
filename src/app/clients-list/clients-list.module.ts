import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ClientsListPageRoutingModule } from './clients-list-routing.module';

import { ClientsListPage } from './clients-list.page';
import { ClientsSearchPipe } from './datalist/client-search.pipe';
import { DatalistComponent } from './datalist/datalist.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ClientsListPageRoutingModule,
  ],
  declarations: [ClientsListPage, ClientsSearchPipe, DatalistComponent],
  exports: [DatalistComponent],
})
export class ClientsListPageModule {}
