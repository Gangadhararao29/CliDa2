import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { OperationLogPageRoutingModule } from './operation-log-routing.module';

import { OperationLogPage } from './operation-log.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    OperationLogPageRoutingModule
  ],
  declarations: [OperationLogPage]
})
export class OperationLogPageModule {}
