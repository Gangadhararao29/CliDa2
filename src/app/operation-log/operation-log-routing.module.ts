import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { OperationLogPage } from './operation-log.page';

const routes: Routes = [
  {
    path: '',
    component: OperationLogPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class OperationLogPageRoutingModule {}
