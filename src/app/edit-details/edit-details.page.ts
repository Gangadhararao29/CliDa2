import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import { ClientDataService } from '../services/client-data.service';

@Component({
  selector: 'app-edit-details',
  templateUrl: './edit-details.page.html',
  styleUrls: ['./edit-details.page.scss'],
})
export class EditDetailsPage {
  clientRecord = {
    principal: 0,
    startDate: '',
    closedAmount: 0,
    closedOn: '',
  };
  clientData: any;
  clientRecordId: any;
  clientKey: any;
  recordType = '';
  clientRecordIndex: number;
  clientName: string;
  constructor(
    private activatedRoute: ActivatedRoute,
    private clientDataService: ClientDataService,
    public alertController: AlertController,
    public toastController: ToastController,
    private router: Router
  ) {}

  ionViewWillEnter() {
    this.activatedRoute.params.subscribe((params) => {
      this.clientKey = params.key;
      this.clientRecordId = params.clientId;
      this.clientDataService.getClientByKey(params.key).then((record) => {
        this.clientData = record;
        this.clientName = record.name;
        this.clientRecordIndex = record.data.findIndex(
          (row) => row.id == params.clientId
        );
        this.clientRecord = this.clientData.data[this.clientRecordIndex];
        this.recordType = this.clientRecord.principal > 0 ? 'credit' : 'debit';
      });
    });
  }

  onSubmit(formRef) {
    if (formRef.valid) {
      this.presentAlertConfirm(formRef);
    }
  }

  resetClosedData() {
    this.resetFieldsConfirmPopup();
  }

  async presentAlertConfirm(formRef) {
    const alert = await this.alertController.create({
      cssClass: 'alertStyle',
      header: 'Confirm',
      backdropDismiss: false,
      animated: true,
      message: '<b>Do you want to save these changes?</b>',
      buttons: [
        {
          text: 'Yes',
          handler: () => {
            this.saveClientsData(formRef);
          },
        },
        {
          text: 'No',
          role: 'cancel',
          cssClass: 'secondary',
        },
      ],
    });

    await alert.present();
  }

  saveClientsData(formRef) {
    this.clientDataService
      .editClientData(
        formRef.value,
        this.recordType,
        this.clientData,
        this.clientRecordIndex
      )
      .then((res) => {
        this.responseHandler(res.data.name);
      });
  }

  responseHandler(name) {
    if (name !== this.clientName) {
      this.clientDataService.deleteClientData(
        this.clientData,
        this.clientRecordIndex,
        this.clientKey
      );
    }
    this.presentToast();
    setTimeout(() => {
      this.router.navigate([
        'clida',
        'clients-list',
        'client-details',
        this.clientKey,
      ]);
    }, 1500);
  }

  async resetFieldsConfirmPopup() {
    const alert = await this.alertController.create({
      cssClass: 'alertStyle',
      header: 'Confirm',
      backdropDismiss: false,
      animated: true,
      message: '<strong>Do you want to reset closedOn details?</strong>',
      buttons: [
        {
          text: 'Yes',
          handler: () => {
            this.clientRecord.closedOn = null;
            this.clientRecord.closedAmount = 0;
          },
        },
        {
          text: 'No',
          role: 'cancel',
          cssClass: 'secondary',
        },
      ],
    });
    await alert.present();
  }

  async presentToast() {
    const toast = await this.toastController.create({
      message:
        'Your changes have been saved.<br>Redirecting to ClientsDetails Menu',
      duration: 2500,
      position: 'top',
      animated: true,
      cssClass: 'successToastClass',
      icon: 'checkmark-outline',
    });
    toast.present();
  }
}
