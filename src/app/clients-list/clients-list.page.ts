import { Component, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, IonRouterOutlet, Platform } from '@ionic/angular';
import { App } from '@capacitor/app';
import { DataBaseService } from '../services/data-base.service';
import { CommonService } from '../services/common.service';
import { localStorConsts, LocalStorageUtils } from '../shared/local-storage';
import { LeasesComponent } from '../shared/leases/leases.component';

@Component({
  selector: 'app-clients-list',
  templateUrl: './clients-list.page.html',
  styleUrls: ['./clients-list.page.scss'],
  standalone: false,
})
export class ClientsListPage {
  @ViewChild('searchbar') searchbar: any | undefined;
  @ViewChild('leaseCalculator') leaseCalculator: LeasesComponent;

  clientSearchValue = '';
  isDataEmpty: boolean = true;
  debitData: Array<any> = [];
  creditData: Array<any> = [];
  leaseData: any[] = [];
  tabSection = 'credits';
  isSearchVisible = false;
  hideSkeletonText: boolean = false;
  theme: string = '';

  constructor(
    private router: Router,
    private platform: Platform,
    private routerOutlet: IonRouterOutlet,
    private alertController: AlertController,
    private dataBaseService: DataBaseService,
    private commonService: CommonService,
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
    this.tabSection =
      LocalStorageUtils.getStringItem(localStorConsts.tabSection) || 'credits';
  }

  getDisplayData(event?: any) {
    this.dataBaseService.getAllClientsDataWithKeys().then((data: any[]) => {
      this.isDataEmpty = data.length == 0;
      this.debitData = [];
      this.creditData = [];

      data.forEach((client: any) => {
        const name = client.data.name;
        const key = client.key;
        const tempDebitData: any[] = [];
        const tempCreditData: any[] = [];
        client.data.data.forEach((record: any) => {
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

      if (event) {
        event.target.complete();
        this.commonService.presentToast(
          'List refreshed',
          'successToastClass',
          'refresh-outline',
        );
      }
    });
  }

  toggleSearch() {
    this.clientSearchValue = '';
    this.isSearchVisible = !this.isSearchVisible;
    if (this.isSearchVisible) {
      this.searchbar?.setFocus();
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
    if (this.tabSection == 'leases') {
      if (this.leaseCalculator) {
        await this.leaseCalculator.getLeaseClients();
      }
      event.target.complete();
      this.commonService.presentToast(
        'Leases list refreshed',
        'successToastClass',
        'refresh-outline',
      );
      return;
    }
    this.getDisplayData(event);
  }

  setListType(type: string) {
    switch (type) {
      case 'debits':
        this.tabSection = 'debits';
        break;
      case 'credits':
        this.tabSection = 'credits';
        break;
      case 'leases':
      default:
        this.tabSection = 'leases';
        break;
    }

    LocalStorageUtils.setStringItem(
      localStorConsts.tabSection,
      this.tabSection,
    );
  }

  initNewLease() {
    this.leaseCalculator.initNewLease();
  }
}
