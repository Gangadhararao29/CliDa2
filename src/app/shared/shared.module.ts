import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatalistComponent } from '../clients-list/datalist/datalist.component';
import { IntroComponent } from '../clients-list/intro/intro.component';
import { ClientsSearchPipe } from '../pipes/client-search.pipe';
import { FaqComponent } from './faq/faq.component';
import { AccountBackupComponent } from './account-backup/account-backup.component';
import { DateYearPipe } from '../pipes/date-year.pipe';
import { LeasesComponent } from './leases/leases.component';
import { TipsCarouselComponent } from './tips-carousel/tips-carousel.component';

@NgModule({
  declarations: [
    IntroComponent,
    DatalistComponent,
    ClientsSearchPipe,
    FaqComponent,
    AccountBackupComponent,
    DateYearPipe,
    LeasesComponent,
    TipsCarouselComponent,
  ],
  exports: [
    IntroComponent,
    DatalistComponent,
    ClientsSearchPipe,
    FaqComponent,
    AccountBackupComponent,
    DateYearPipe,
    LeasesComponent,
    TipsCarouselComponent,
  ],
  imports: [CommonModule, RouterModule, IonicModule, FormsModule],
})
export class SharedModule {}
