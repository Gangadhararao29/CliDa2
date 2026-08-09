import { Component, Renderer2, ViewChild } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { CommonService } from '../services/common.service';
import { DataBaseService } from '../services/data-base.service';
import { localStorConsts, LocalStorageUtils } from '../shared/local-storage';
import { LeaseService } from '../services/lease.service';
import { getDeviceInfo, DeviceInfo } from '../shared/device-info.util';

@Component({
  selector: 'app-about',
  templateUrl: './about.page.html',
  styleUrls: ['./about.page.scss'],
  standalone: false,
})
export class AboutPage {
  @ViewChild('modal1') modal1: any;
  @ViewChild('select2') select2;

  themeName = LocalStorageUtils.getItem(localStorConsts.theme);
  isModalOpen = false;
  latestVersion = '0.0.0';
  currentVersion = '3.26.06';
  gitHubResponse = [];
  loadingData = true;
  theme: string;
  isWebVersion: boolean = false;
  isUpdateAvailable = false;
  deviceInfo?: DeviceInfo;

  constructor(
    public alertController: AlertController,
    private renderer: Renderer2,
    private httpClient: HttpClient,
    private commonService: CommonService,
    private dataBaseService: DataBaseService,
    private leaseService: LeaseService,
  ) {}

  ionViewWillEnter() {
    this.isWebVersion = Capacitor.getPlatform() != 'web' ? false : true;
    this.theme = this.commonService.getTheme();
    this.loadingData = false;
    this.deviceInfo = getDeviceInfo();
  }

  checkForUpdate() {
    this.isModalOpen = false;
    App.getInfo().then((suc) => {
      this.currentVersion = suc.version;
      // this.updateUpdateAvailability();
    });
    this.httpClient
      .get('https://api.github.com/repos/gangadhararao29/clida2/releases')
      .subscribe((res: Array<any>) => {
        this.gitHubResponse = res;
        this.latestVersion = this.gitHubResponse[0].tag_name.slice(1);
        // this.updateUpdateAvailability();
        this.isModalOpen = true;
      });
  }

  private updateUpdateAvailability() {
    const lv = this.latestVersion.split('.').map(Number);
    const cv = this.currentVersion.split('.').map(Number);

    const isFirstUpdate = lv[0] >= cv[0];
    const isSecondUpdate = lv[1] >= cv[1];
    const isThirdUpdate = lv[2] > cv[2];

    this.isUpdateAvailable = isFirstUpdate && isSecondUpdate && isThirdUpdate;
  }

  setOpen(isOpen: boolean) {
    this.isModalOpen = isOpen;
  }

  async presentDeleteAlert() {
    const alert = await this.alertController.create({
      header: 'Reset app data?',
      message: 'This will remove all saved data and restore default settings.',
      backdropDismiss: false,
      animated: true,
      cssClass: 'alertStyle',
      buttons: [
        {
          text: 'Reset',
          role: 'submit',
          cssClass: 'bg-danger',
          handler: () => {
            this.resetData();
          },
        },
        {
          text: 'Cancel',
          role: 'cancel',
        },
      ],
    });
    await alert.present();
  }

  resetData() {
    this.dataBaseService.deleteDataBase();
    this.leaseService.deleteDataBase();
    localStorage.clear();
    this.changeTheme({ detail: { value: 'auto' } });
    this.select2.value = 'auto';
    this.commonService.presentToast(
      'The factory reset has been completed successfully.',
    );
  }

  handleThemeBtnClick() {
    this.select2?.el?.click();
  }

  changeTheme(event) {
    LocalStorageUtils.setStringItem(localStorConsts.theme, event.detail.value);
    this.theme = event.detail.value;
    switch (event.detail.value) {
      case 'light': {
        this.renderer.removeClass(document.body, 'dark');
        break;
      }
      case 'dark': {
        this.renderer.addClass(document.body, 'dark');
        break;
      }
      case 'auto': {
        const preferColorMode = window.matchMedia(
          '(prefers-color-scheme:dark)',
        );
        if (preferColorMode.matches) {
          this.theme = 'dark';
          this.renderer.addClass(document.body, 'dark');
        } else {
          this.theme = 'light';
          this.renderer.removeClass(document.body, 'dark');
        }
        break;
      }
    }
  }

  async changeSort(event) {
    if (event.target.value) {
      await this.commonService.presentLoading('Sorting data...');
      event.target.disabled = true;
      const clients = await this.dataBaseService.getAllClientsData();
      clients.map((ele) => {
        ele.data.sort((a, b) => {
          let keyA = new Date(a.startDate);
          let keyB = new Date(b.startDate);
          if (!(a.closedOn && b.closedOn)) {
            if (a.closedOn) keyA = new Date();
            if (b.closedOn) keyB = new Date();
          }
          return keyA < keyB ? -1 : +1;
        });
      });

      if (event.target.value === 'name') {
        clients.sort((a, b) => (a.name < b.name ? -1 : +1));
      } else if (event.target.value === 'year') {
        clients.sort((a, b) => {
          let keyA = new Date(a.data[0].startDate);
          let keyB = new Date(b.data[0].startDate);
          if (!(a.data[0].closedOn && b.data[0].closedOn)) {
            if (a.data[0].closedOn) keyA = new Date();
            if (b.data[0].closedOn) keyB = new Date();
          }
          return keyA < keyB ? -1 : +1;
        });
      }

      await this.dataBaseService.saveBulkClients(clients, true);
      await this.commonService.dismissLoading();
      setTimeout(() => {
        this.commonService.presentToast(
          'The data has been sorted successfully.',
        );
        event.target.disabled = false;
        event.target.value = null;
      });
    }
  }

  cleanData() {
    this.dataBaseService.cleanClientsData().then((res) => {
      this.commonService.presentLoading('Cleaning data...', 1000).then(() => {
        this.commonService.presentToast(
          'All empty data and errors have been fixed.',
        );
      });
    });
  }

  cleanApproveData() {
    this.dataBaseService.cleanApprovedData().then((res) => {
      this.commonService
        .presentLoading('Removing closed records...', 1000)
        .then(() => {
          this.commonService.presentToast(
            'All approved data has been removed.',
          );
        });
    });
  }

  getDateString(dateString) {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  ionViewWillLeave() {
    this.isModalOpen = false;
    this.modal1.dismiss();
  }
}
