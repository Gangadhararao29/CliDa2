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
  client = {
    name: '',
    principal: 0,
    startDate: '',
    closedAmount: 0,
    closedOn: '',
  };
  clientData: any;
  clientId: any;
  clientKey: any;
  allClientData = [];
  constructor(
    private activatedRoute: ActivatedRoute,
    private clientDataService: ClientDataService,
    public alertController: AlertController,
    public toastController: ToastController,
    private router: Router
  ) {}

  ionViewWillEnter() {
    this.activatedRoute.params.subscribe((params) => {
      this.clientId = params.clientId;
      this.clientKey = params.key;
      this.clientDataService.getClientByKey(params.key).then((record) => {
        this.clientData = record;
        this.client = record.data.find((row) => row.id == params.clientId);
        this.client.name = record.name;
        this.clientDataService.getRawClients().then((response) => {
          this.allClientData = response;
        });
      });
    });
  }

  onSubmit(formRef) {
    if (formRef.valid) {
      formRef.value.name = formRef.value.name.replace(
        /(^\w|\s\w)(\S*)/g,
        (_, m1, m2) => m1.toUpperCase() + m2.toLowerCase()
      );
      this.presentAlertConfirm(formRef);
    }
  }

  resetClosedData() {
    this.resetFieldsConfirmPopup();
  }

  async presentAlertConfirm(formRef) {
    const alert = await this.alertController.create({
      cssClass: 'my-custom-class',
      header: 'Confirm!',
      message: '<strong>Do you want to save these changes?</strong>',
      buttons: [
        {
          text: 'No',
          role: 'cancel',
          cssClass: 'secondary',
        },
        {
          text: 'Yes',
          handler: () => {
            this.saveClientsData(formRef);
          },
        },
      ],
    });

    await alert.present();
  }

  saveClientsData(formRef) {
    if (this.clientData.name == formRef.value.name) {
      this.clientData.data.forEach((record) => {
        if (record.id == this.clientId) {
          record.principal = formRef.value.principal;
          record.interest = formRef.value.interest;
          record.startDate = formRef.value.startDate;
          record.closedOn = formRef.value.closedOn;
          record.closedAmount = formRef.value.closedAmount;
        }
      });

      this.clientDataService
        .updateClientRecordByName(this.clientData)
        .then((res) => {
          this.responseHandler();
        });
    } else {
      console.log(this.allClientData);
      const existingClient = this.allClientData.find(
        (record) => record.name == formRef.value.name
      );
      if (existingClient) {
        existingClient.data.push({
          principal: formRef.value.principal,
          interest: formRef.value.interest,
          startDate: formRef.value.startDate,
          closedOn: formRef.value.closedOn,
          closedAmount: formRef.value.closedAmount,
        });
        this.clientDataService
          .updateClientRecordByName(existingClient)
          .then(() => {
            this.deleteRecordAndSaveNewRecord();
          });
      } else {
        this.clientDataService
          .addNewClient({
            name: formRef.value.name,
            data: [
              {
                principal: formRef.value.principal,
                interest: formRef.value.interest,
                startDate: formRef.value.startDate,
                closedOn: formRef.value.closedOn,
                closedAmount: formRef.value.closedAmount,
              },
            ],
          })
          .then(() => {
            this.responseHandler();
          });
      }
    }
  }

  deleteRecordAndSaveNewRecord() {
    const index = this.clientData.data.findIndex(
      (ele) => ele.id == this.clientId
    );
    const clientDataLength = this.clientData.data.length;
    this.clientData.data.splice(index, 1);
    if (clientDataLength == 1) {
      this.clientDataService.deleteClient(this.clientKey).then(() => {
        this.responseHandler();
      });
    } else {
      this.clientDataService
        .updateClientRecordByName(this.clientData)
        .then(() => {
          this.responseHandler();
        });
    }
  }

  responseHandler() {
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
      cssClass: 'my-custom-class',
      header: 'Confirm!',
      message: '<strong>Do you want to reset closedOn details?</strong>',
      buttons: [
        {
          text: 'No',
          role: 'cancel',
          cssClass: 'secondary',
        },
        {
          text: 'Yes',
          handler: () => {
            this.client.closedOn = null;
            this.client.closedAmount = 0;
          },
        },
      ],
    });
    await alert.present();
  }

  async presentToast() {
    const toast = await this.toastController.create({
      message:
        'Your changes have been saved.<br>Redirecting to ClientsDetails Tab',
      duration: 2500,
      position: 'top',
    });
    toast.present();
  }
}
