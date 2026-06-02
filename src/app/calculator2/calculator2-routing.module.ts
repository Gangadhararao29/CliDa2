import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { Calculator2Page } from './calculator2.page';

const routes: Routes = [
  {
    path: '',
    component: Calculator2Page
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class Calculator2PageRoutingModule {}
