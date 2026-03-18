import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { DatalistComponent } from '../clients-list/datalist/datalist.component';
import { IntroComponent } from '../clients-list/intro/intro.component';
import { ClientsSearchPipe } from '../pipes/client-search.pipe';
import { FaqComponent } from './faq/faq.component';

@NgModule({
  declarations: [IntroComponent, DatalistComponent, ClientsSearchPipe, FaqComponent],
  exports: [IntroComponent, DatalistComponent, ClientsSearchPipe, FaqComponent],
  imports: [CommonModule, RouterModule, IonicModule],
})
export class SharedModule {}
