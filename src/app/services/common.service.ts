import { Injectable } from '@angular/core';
import {
  LoadingController,
  LoadingOptions,
  ToastController,
} from '@ionic/angular';
import { Subject } from 'rxjs';
import { localStorConsts, LocalStorageUtils } from '../shared/local-storage';

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
    private loadingController: LoadingController
  ) { }

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

  async presentLoading(message = 'Loading...', duration = 5000) {
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
    let theme = LocalStorageUtils.getItem(localStorConsts.theme);
    const preferColorMode = window.matchMedia('(prefers-color-scheme:dark)');
    if (theme == null || theme == 'auto') {
      theme = preferColorMode.matches ? 'dark' : 'light';
    }
    return theme;
  }

  getUserPreferences() {
    const theme = LocalStorageUtils.getStringItem(localStorConsts.theme);
    const dashPref = LocalStorageUtils.getStringItem(localStorConsts.dashPref);
    const oldStyle = LocalStorageUtils.getStringItem(localStorConsts.isOldStyle);
    const tabSection = LocalStorageUtils.getStringItem(localStorConsts.tabSection);
    const logs = LocalStorageUtils.getItem(localStorConsts.logs);
    const calcLogs = LocalStorageUtils.getItem(localStorConsts.calcsHistory);
    return {
      userPreferences: { theme, dashPref, oldStyle, tabSection },
      logs,
      calcLogs
    };
  }

  setUserPreferences(preferences) {
    const { userPreferences, logs, calcLogs } = preferences;
    LocalStorageUtils.setStringItem(localStorConsts.theme, userPreferences.theme);
    LocalStorageUtils.setStringItem(
      localStorConsts.dashPref,
      userPreferences.dashPref,
    );
    LocalStorageUtils.setStringItem(
      localStorConsts.isOldStyle,
      userPreferences.oldStyle,
    );
    LocalStorageUtils.setStringItem(
      localStorConsts.tabSection,
      userPreferences.tabSection,
    );
    LocalStorageUtils.setItem(localStorConsts.logs, logs || []);
    LocalStorageUtils.setItem(localStorConsts.calcsHistory, calcLogs || []);
  }
}
