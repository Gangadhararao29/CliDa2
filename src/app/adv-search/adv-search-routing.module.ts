import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AdvSearchPage } from './adv-search.page';

const routes: Routes = [
  {
    path: '',
    component: AdvSearchPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdvSearchPageRoutingModule {}
