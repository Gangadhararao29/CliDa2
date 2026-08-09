import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ConsoleLogsPageRoutingModule } from './console-logs-routing.module';

import { ConsoleLogsPage } from './console-logs.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ConsoleLogsPageRoutingModule,
  ],
  declarations: [ConsoleLogsPage],
})
export class ConsoleLogsPageModule {}
