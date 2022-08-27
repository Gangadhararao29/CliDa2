import { Component } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';

@Component({
  selector: 'app-operation-log',
  templateUrl: './operation-log.page.html',
  styleUrls: ['./operation-log.page.scss'],
})
export class OperationLogPage {
  logData = [];
  constructor(
    private alertController: AlertController,
    private toastController: ToastController
  ) {}

  ionViewWillEnter() {
    this.logData = localStorage.getItem('logs')
      ? JSON.parse(localStorage.getItem('logs')).reverse()
      : [];
  }

  getColor(operation) {
    switch (operation) {
      case 'new':
        return 'success';
      case 'edit':
      case 'edit - approve':
        return 'primary';
      case 'delete':
        return 'danger';
    }
  }

  async showClearLogsAlert() {
    const alert = await this.alertController.create({
      header: 'Confirm',
      message: '<strong>Do you want to clear all logs?</strong>',
      cssClass: 'alertStyle',
      backdropDismiss: false,
      animated: true,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'OK',
          role: 'confirm',
          handler: () => {
            this.logData = [];
            localStorage.removeItem('logs');
            this.presentToast('Logs cleared successfully');
          },
        },
      ],
    });

    await alert.present();
  }

  async presentToast(
    message,
    cssClass = 'successToastClass',
    icon = 'checkmark-outline'
  ) {
    const toast = await this.toastController.create({
      message,
      position: 'top',
      duration: 2500,
      animated: true,
      cssClass,
      icon,
    });
    toast.present();
  }
}
