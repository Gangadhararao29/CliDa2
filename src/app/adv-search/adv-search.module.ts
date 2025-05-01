import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AdvSearchPageRoutingModule } from './adv-search-routing.module';

import { AdvSearchPage } from './adv-search.page';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AdvSearchPageRoutingModule,
    SharedModule,
  ],
  declarations: [AdvSearchPage],
})
export class AdvSearchPageModule {}
