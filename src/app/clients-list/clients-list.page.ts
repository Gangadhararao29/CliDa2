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
  debitData = [];
  creditData = [];
  showDebitList: boolean;
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
      this.debitData = [];
      this.creditData = [];

      this.clientsData.forEach((client) => {
        const name = client.data.name;
        const key = client.key;
        const tempDebitData = [];
        const tempCreditData = [];
        client.data.data.forEach((record) => {
          if (record.principal < 0) {
            tempDebitData.push(record);
          } else {
            tempCreditData.push(record);
          }
        });
        if (tempDebitData.length) {
          this.debitData.push({ key, data: { name, data: tempDebitData } });
        }
        if (tempCreditData.length) {
          this.creditData.push({ key, data: { name, data: tempCreditData } });
        }
      });
      const tabSection = localStorage.getItem('tabSection');
      this.showDebitList = tabSection === 'debits' ? true : false;
    });
  }

  resetSearch() {
    this.clientSearchValue = null;
  }

  openClientDetails(key) {
    this.router.navigate(['clida/clients-list/client-details', key]);
  }

  async presentAlertConfirm() {
    const alert = await this.alertController.create({
      header: 'Exit',
      cssClass: 'alertStyle',
      backdropDismiss: false,
      animated: true,
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

  getColor(detail) {
    const tm = this.clientDataService.calculateTimeperiod(detail?.startDate).tm;
    if (detail?.closedOn) {
      return 'success';
    } else if (tm >= 30) {
      return 'danger';
    } else if (tm >= 24) {
      return 'warning';
    } else if (tm >= 12) {
      return 'secondary';
    } else {
      return 'primary';
    }
  }

  setListType(event) {
    this.showDebitList = event.detail.value === 'debits' ? true : false;
    localStorage.setItem('tabSection', event.detail.value);
  }
}
