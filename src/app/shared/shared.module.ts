import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { DatalistComponent } from '../clients-list/datalist/datalist.component';
import { IntroComponent } from '../clients-list/intro/intro.component';
import { ClientsSearchPipe } from '../pipes/client-search.pipe';

@NgModule({
  declarations: [IntroComponent, DatalistComponent, ClientsSearchPipe],
  exports: [IntroComponent, DatalistComponent, ClientsSearchPipe],
  imports: [CommonModule, RouterModule, IonicModule],
})
export class SharedModule {}
