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
    path: '',
    redirectTo: '/clida/clients-list',
    pathMatch: 'full',
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
})
export class TabsPageRoutingModule {}
