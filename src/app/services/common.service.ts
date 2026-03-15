import { Injectable } from '@angular/core';
import {
  LoadingController,
  LoadingOptions,
  ToastController,
} from '@ionic/angular';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CommonService {
  today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
  pageRefreshEmitter = new Subject<any>();
  loadingInstance: HTMLIonLoadingElement | null = null;

  constructor(
    private toastController: ToastController,
    private loadingController: LoadingController,
  ) {}

  async presentToast(
    message,
    cssClass = 'successToastClass',
    icon = 'checkmark-outline',
  ) {
    const toast = await this.toastController.create({
      message,
      position: 'top',
      duration: 2800,
      animated: true,
      cssClass,
      icon,
    });
    toast.present();
  }

  async presentLoading(message = 'Loading...', duration = 3000) {
    let loadingConfig: LoadingOptions = {
      animated: true,
      spinner: 'lines',
      message,
      duration,
    };

    this.loadingInstance = await this.loadingController.create(loadingConfig);
    this.loadingInstance.present();
  }

  async dismissLoading() {
    if (this.loadingInstance) {
      await this.loadingInstance.dismiss();
      this.loadingInstance = null;
    }
  }

  getCommentHeight(event) {
    event.target.style.height = 0;
    event.target.style.height = `${event.target.scrollHeight}px`;
  }

  getTheme() {
    let theme = localStorage.getItem('theme');
    const preferColorMode = window.matchMedia('(prefers-color-scheme:dark)');
    if (theme == null || theme == 'auto') {
      theme = preferColorMode.matches ? 'dark' : 'light';
    }
    return theme;
  }

  getUserPreferences() {
    const theme = localStorage.getItem('theme');
    const dashPref = localStorage.getItem('dashPref');
    const oldStyle = localStorage.getItem('isOldStyle');
    const logs = localStorage.getItem('logs');
    const tabSection = localStorage.getItem('tabSection');
    const calcLogs = localStorage.getItem('calcsHistory');
    const leases = localStorage.getItem('leaseClients');
    return {
      userPreference: { theme, dashPref, oldStyle, tabSection },
      userData: null,
      logs,
      calcLogs,
      leases,
    };
  }

  setUserPreferences(preferences) {
    const { userPreference, logs, calcLogs, leases } = preferences;
    localStorage.setItem('theme', userPreference.theme);
    localStorage.setItem('dashPref', userPreference.dashPref);
    localStorage.setItem('isOldStyle', userPreference.oldStyle);
    localStorage.setItem('tabSection', userPreference.tabSection);
    localStorage.setItem('logs', logs);
    localStorage.setItem('calcsHistory', calcLogs);
    localStorage.setItem('leaseClients', leases);
  }
}
