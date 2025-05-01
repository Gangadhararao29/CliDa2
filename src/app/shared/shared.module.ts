import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { ClientsSearchPipe } from '../clients-list/datalist/client-search.pipe';
import { DatalistComponent } from '../clients-list/datalist/datalist.component';
import { IntroComponent } from '../clients-list/intro/intro.component';

@NgModule({
  declarations: [IntroComponent, DatalistComponent, ClientsSearchPipe],
  exports: [IntroComponent, DatalistComponent],
  imports: [CommonModule, RouterModule, IonicModule],
})
export class SharedModule {}
