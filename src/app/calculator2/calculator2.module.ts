import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { Calculator2PageRoutingModule } from './calculator2-routing.module';

import { Calculator2Page } from './calculator2.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    Calculator2PageRoutingModule
  ],
  declarations: [Calculator2Page]
})
export class Calculator2PageModule {}
