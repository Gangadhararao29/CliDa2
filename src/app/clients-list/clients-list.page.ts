import { Component, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, IonRouterOutlet, Platform } from '@ionic/angular';
import { App } from '@capacitor/app';
import { DataBaseService } from '../services/data-base.service';
import { CalculationService } from '../services/calculation.service';
import { CommonService } from '../services/common.service';
import { NotificationService } from '../services/notification.service';

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
    private calculationService: CalculationService,
    private notificationService: NotificationService
  ) {
    this.platform.backButton.subscribeWithPriority(-1, () => {
      if (!this.routerOutlet.canGoBack()) {
        this.backButtonAction();
      }
    });
  }

  async backButtonAction() {
    const alert = await this.alertController.getTop();

    if (alert) {
      await alert.dismiss();
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

  getDisplayData(event?: any) {
    this.dataBaseService.getAllClientsDataWithKeys().then((data) => {
      this.showEntryText = data.length == 0;
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
      this.checkNotifications(data);

      if (event) {
        event.target.complete();
        this.commonService.presentToast(
          'List refreshed',
          'successToastClass',
          'refresh-outline'
        );
      }
    });
  }

  checkNotifications(data: any[]) {
    const settings = this.notificationService.getSettings();
    if (!settings.enabled || !this.notificationService.shouldRunCheck()) return;

    data.forEach((client) => {
      client.data.data.forEach((record) => {
        // Only notify for open transactions
        if (!record.closedOn) {
          const startDate = new Date(record.startDate);
          const shouldNotify = this.notificationService.shouldTriggerReminder(startDate);

          if (shouldNotify.trigger) {
            this.notificationService.schedulePaymentReminder(
              client.key,
              record.id,
              client.data.name,
              record.principal,
              startDate,
              shouldNotify.targetYear,
              shouldNotify.monthsLeft
            );
          }
        }
      });
    });

    this.notificationService.markCheckComplete();
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
      header: 'Exit app?',
      message: 'Are you sure you want to exit the app?',
      cssClass: 'alertStyle',
      backdropDismiss: false,
      animated: true,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Exit',
          cssClass: 'bg-primary',
          handler: () => {
            App.exitApp();
          },
        },
      ],
    });
  }

  async handleRefresh(event: any) {
    this.getDisplayData(event);
  }

  setListType(type) {
    this.showDebitList = type === 'debits' ? true : false;
    localStorage.setItem('tabSection', type);
  }
}
