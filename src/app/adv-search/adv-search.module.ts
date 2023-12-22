import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AdvSearchPageRoutingModule } from './adv-search-routing.module';

import { AdvSearchPage } from './adv-search.page';
import { ClientsListPageModule } from '../clients-list/clients-list.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AdvSearchPageRoutingModule,
    ClientsListPageModule
  ],
  declarations: [AdvSearchPage]
})
export class AdvSearchPageModule {}
