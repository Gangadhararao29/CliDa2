import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ConsoleLogsPage } from './console-logs.page';

const routes: Routes = [
  {
    path: '',
    component: ConsoleLogsPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ConsoleLogsPageRoutingModule {}
