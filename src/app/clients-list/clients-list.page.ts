import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, IonRouterOutlet, Platform } from '@ionic/angular';
import { App } from '@capacitor/app';
import { ClientDataService } from '../services/client-data.service';

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
  tabSection = 'credits';
  searchIcon = 'search-sharp';
  hideSkeletonText: boolean;
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
    this.getDisplayData();
    if (localStorage.getItem('tabSection') === 'debits') {
      this.tabSection = 'debits';
      this.showDebitList = true;
    } else {
      this.tabSection = 'credits';
      this.showDebitList = false;
    }
  }

  getDisplayData() {
    this.clientDataService.getAllClientsDataWithKeys().then((data) => {
      this.clientsData = data;
      this.showEntryText = data.length > 0 ? false : true;
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
      this.hideSkeletonText = true;
    });
  }

  resetSearch() {
    this.clientSearchValue = null;
    this.searchIcon =
      this.searchIcon === 'search-sharp' ? 'remove-sharp' : 'search-sharp';
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

  setrecordType(event) {
    this.showDebitList = event.detail.value === 'debits' ? true : false;
    localStorage.setItem('tabSection', event.detail.value);
  }
}
