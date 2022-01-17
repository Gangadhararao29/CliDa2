import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ClientsListPageRoutingModule } from './clients-list-routing.module';

import { ClientsListPage } from './clients-list.page';
import { ClientsSearchPipe } from './client-search.pipe';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ClientsListPageRoutingModule,
  ],
  declarations: [ClientsListPage, ClientsSearchPipe],
})
export class ClientsListPageModule {}
