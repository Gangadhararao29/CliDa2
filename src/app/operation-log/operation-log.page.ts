import { Component } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';
import { CommonService } from '../services/common.service';

@Component({
  selector: 'app-operation-log',
  templateUrl: './operation-log.page.html',
  styleUrls: ['./operation-log.page.scss'],
  standalone: false,
})
export class OperationLogPage {
  logData = [];
  logDataGroup = [];
  expandedGroups = {};
  theme: string;
  constructor(
    private alertController: AlertController,
    private toastController: ToastController,
    private commonService: CommonService
  ) {}

  ionViewWillEnter() {
    const logsString = localStorage.getItem('logs');
    this.theme = this.commonService.getTheme();
    this.logData = logsString ? JSON.parse(logsString).reverse() : [];
    let index = -1;

    this.logDataGroup = [];

    this.logData.forEach((log) => {
      index = this.logDataGroup.findIndex(
        (logGroup) => logGroup.modifiedOn === log.modifiedOn
      );

      if (index === -1) {
        this.expandedGroups[log.modifiedOn] =
          this.expandedGroups[log.modifiedOn] || false;
        this.logDataGroup.push({ modifiedOn: log.modifiedOn, logs: [log] });
      } else {
        this.logDataGroup[index].logs.push(log);
      }
    });
  }

  async showClearLogsAlert() {
    const alert = await this.alertController.create({
      header: 'Clear logs ?',
      message: 'All log entries will be cleared from this device',
      cssClass: 'alertStyle',
      backdropDismiss: false,
      animated: true,
      buttons: [
        {
          text: 'Clear',
          role: 'confirm',
          cssClass: 'bg-danger',
          handler: () => {
            this.logData = [];
            localStorage.removeItem('logs');
            this.presentToast('Logs cleared successfully');
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

  getStatusColor(status: string) {
    switch (status) {
      case 'new':
        return 'success';
      case 'delete':
        return 'danger';
      case 'edit - approve':
        return 'primary';
      case 'edit':
        return 'warning';
      default:
        return 'medium';
    }
  }

  toggleGroup(date) {
    this.expandedGroups[date] = !this.expandedGroups[date];
  }
}
