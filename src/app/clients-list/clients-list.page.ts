import { Component, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, IonRouterOutlet, Platform } from '@ionic/angular';
import { App } from '@capacitor/app';
import { DataBaseService } from '../services/data-base.service';
import { CalculationService } from '../services/calculation.service';
import { CommonService } from '../services/common.service';

@Component({
  selector: 'app-clients-list',
  templateUrl: './clients-list.page.html',
  styleUrls: ['./clients-list.page.scss'],
  standalone: false,
})
export class ClientsListPage {
  @ViewChild('searchbar') searchbar: any;
  clientSearchValue = '';
  showEntryText: boolean;
  debitData = [];
  creditData = [];
  showDebitList: boolean;
  tabSection = 'credits';
  isSearchVisible = false;
  hideSkeletonText: boolean;
  theme: string;
  constructor(
    private router: Router,
    private platform: Platform,
    private routerOutlet: IonRouterOutlet,
    private alertController: AlertController,
    private dataBaseService: DataBaseService,
    private commonService: CommonService,
    private calculationService: CalculationService
  ) {
    this.platform.backButton.subscribeWithPriority(-1, () => {
      if (!this.routerOutlet.canGoBack()) {
        this.backButtonAction();
      }
    });
  }

  async backButtonAction() {
    const alrt = await this.alertController.getTop();

    if (alrt) {
      await alrt.dismiss();
    } else if (this.router.url === '/clients-list') {
      const alert = await this.getCloseAlert();
      await alert.present();
    } else {
      this.router.navigate(['/clients-list']);
    }
  }

  ionViewWillEnter() {
    this.hideSkeletonText = false;
    this.theme = this.commonService.getTheme();
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
    this.dataBaseService.getAllClientsDataWithKeys().then((data) => {
      this.showEntryText = data.length > 0 ? false : true;
      this.debitData = [];
      this.creditData = [];

      data.forEach((client) => {
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

  toggleSearch() {
    this.clientSearchValue = null;
    this.isSearchVisible = !this.isSearchVisible;
    if (this.isSearchVisible) {
      this.searchbar.setFocus();
    }
  }

  async getCloseAlert() {
    return await this.alertController.create({
      header: 'Exit',
      cssClass: 'alertStyle',
      backdropDismiss: false,
      animated: true,
      message: 'Do you want to close the app?',
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
  }

  getColor(detail) {
    const tm = this.calculationService.calculateTimeperiod(detail?.startDate).tm;
    if (detail?.closedOn) {
      return 'success';
    } else if (tm >= 30) {
      return 'danger';
    } else if (tm >= 24) {
      return 'warning';
    } else if (tm >= 12) {
      return 'primary';
    } else {
      return 'medium';
    }
  }

  setListType(type) {
    this.showDebitList = type === 'debits' ? true : false;
    localStorage.setItem('tabSection', type);
  }
}
