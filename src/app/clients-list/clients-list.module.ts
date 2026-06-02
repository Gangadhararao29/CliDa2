import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ClientsListPageRoutingModule } from './clients-list-routing.module';

import { ClientsListPage } from './clients-list.page';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ClientsListPageRoutingModule,
    SharedModule,
  ],
  declarations: [ClientsListPage],
  exports: [],
})
export class ClientsListPageModule {}
