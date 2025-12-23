import { Injectable } from '@angular/core';
import { LoadingController, ToastController } from '@ionic/angular';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CommonService {
  today = new Date()
    .toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
    .split('/')
    .reverse()
    .join('-');
  pageRefreshEmitter = new Subject<any>();

  constructor(
    private toastController: ToastController,
    private loadingController: LoadingController
  ) {}

  async presentToast(
    message,
    cssClass = 'successToastClass',
    icon = 'checkmark-outline'
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

  async presentLoading() {
    const loading = await this.loadingController.create({
      animated: true,
      message: 'Loading...',
      duration: 1000,
      spinner: 'lines',
    });
    await loading.present();
  }

  getTheme() {
    let theme = localStorage.getItem('theme');
    const preferColorMode = window.matchMedia('(prefers-color-scheme:dark)');
    if (theme == null || theme == 'auto') {
      theme = preferColorMode.matches ? 'dark' : 'light';
    }
    return theme;
  }
}
