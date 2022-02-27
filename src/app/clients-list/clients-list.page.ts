import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, IonRouterOutlet, Platform } from '@ionic/angular';
import { Plugins } from '@capacitor/core';
import { ClientDataService } from '../services/client-data.service';
// eslint-disable-next-line @typescript-eslint/naming-convention
const { App } = Plugins;

@Component({
  selector: 'app-clients-list',
  templateUrl: './clients-list.page.html',
  styleUrls: ['./clients-list.page.scss'],
})
export class ClientsListPage {
  clientsData: any;
  clientSearchValue = '';
  showEntryText: boolean;
  constructor(
    private router: Router,
    private platform: Platform,
    private routerOutlet: IonRouterOutlet,
    private alertController: AlertController,
    private clientDataService: ClientDataService
  ) {
    this.platform.backButton.subscribeWithPriority(-1, () => {
      if (!this.routerOutlet.canGoBack()) {
        this.presentAlertConfirm();
      }
    });
  }

  ionViewWillEnter() {
    this.clientDataService.getAllClientsData().then((data) => {
      this.clientsData = data;
      this.showEntryText = this.clientsData.length > 0 ? false : true;
    });
  }

  getRecordsInfo(data) {
    let closed = 0;
    data.forEach((record) => {
      if (record.closedOn) {
        closed++;
      }
    });
    return closed ? closed : null;
  }

  resetSearch() {
    this.clientSearchValue = null;
  }

  openClientDetails(name) {
    this.router.navigate(['clida/clients-list/client-details', name]);
  }

  async presentAlertConfirm() {
    const alert = await this.alertController.create({
      header: 'Exit',
      cssClass: 'alertStyle',
      backdropDismiss:false,
      animated:true,
      message: '<strong>Do you want to close the app?</strong>',
      buttons: [
        {
          text: 'No',
          role: 'cancel',
          cssClass: 'secondary',
        },
        {
          text: 'Yes',
          handler: () => {
            App.exitApp();
          },
        },
      ],
    });
    await alert.present();
  }
}
