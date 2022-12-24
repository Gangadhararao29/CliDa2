import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

const routes: Routes = [
  {
    path: 'clida',
    component: TabsPage,
    children: [
      {
        path: 'clients-list',
        loadChildren: () =>
          import('../clients-list/clients-list.module').then(
            (m) => m.ClientsListPageModule
          ),
      },
      {
        path: 'clients-list/client-details/:key',
        loadChildren: () =>
          import('../client-details/client-details.module').then(
            (m) => m.ClientDetailsPageModule
          ),
      },
      {
        path: 'dashboard',
        loadChildren: () =>
          import('../dashboard/dashboard.module').then(
            (m) => m.DashboardPageModule
          ),
      },
      {
        path: 'dashboard/adv-search',
        loadChildren: () =>
          import('../adv-search/adv-search.module').then(
            (m) => m.AdvSearchPageModule
          ),
      },
      {
        path: 'dashboard/adv-search/client-details/:key',
        loadChildren: () =>
          import('../client-details/client-details.module').then(
            (m) => m.ClientDetailsPageModule
          ),
      },
      {
        path: 'dashboard/client-details/:key',
        loadChildren: () =>
          import('../client-details/client-details.module').then(
            (m) => m.ClientDetailsPageModule
          ),
      },
      {
        path: 'calculator/:key/:id',
        loadChildren: () =>
          import('../calculator/calculator.module').then(
            (m) => m.CalculatorPageModule
          ),
      },
      {
        path: 'calculator',
        redirectTo: 'calculator/0/0',
      },
      {
        path: 'about',
        loadChildren: () =>
          import('../about/about.module').then((m) => m.AboutPageModule),
      },
      {
        path: 'about/logs',
        loadChildren: () =>
          import('../operation-log/operation-log.module').then(
            (m) => m.OperationLogPageModule
          ),
      },
      {
        path: 'clients-list/add-client',
        loadChildren: () =>
          import('../add-client/add-client.module').then(
            (m) => m.AddClientPageModule
          ),
      },
      {
        path: 'clients-list/client-details/:key/edit-details/:clientId',
        loadChildren: () =>
          import('../edit-details/edit-details.module').then(
            (m) => m.EditDetailsPageModule
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: '/clida/clients-list',
    pathMatch: 'prefix',
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
})
export class TabsPageRoutingModule {}
