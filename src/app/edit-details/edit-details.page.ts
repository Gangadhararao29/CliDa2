import { Component, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { ClientDataService } from '../services/client-data.service';

@Component({
  selector: 'app-edit-details',
  templateUrl: './edit-details.page.html',
  styleUrls: ['./edit-details.page.scss'],
})
export class EditDetailsPage {
  @ViewChild('commentHeight') commentSection: any;
  clientRecord = {
    principal: 0,
    interest: 0,
    startDate: '',
    closedAmount: 0,
    closedOn: '',
    comments: '',
  };
  clientData: any;
  clientRecordId: any;
  clientKey: any;
  clientRecordIndex: number;
  clientName: string;
  constructor(
    private activatedRoute: ActivatedRoute,
    private clientDataService: ClientDataService,
    public alertController: AlertController,
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
        this.setCommentHeight();
      });
    });
  }

  setCommentHeight() {
    setTimeout(() => {
      this.commentSection.nativeElement.style.height = `${this.commentSection.nativeElement.scrollHeight}px`;
    });
  }

  getCommentHeight(event) {
    event.target.style.height = 0;
    event.target.style.height = `${event.target.scrollHeight}px`;
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
      message: 'Do you want to save these changes?',
      buttons: [
        {
          text: 'Yes',
          handler: () => {
            this.clientDataService.presentLoading();
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
      .editClientData(formRef.value, this.clientData, this.clientRecordIndex)
      .then((res) => {
        this.responseHandler(res.data.name);
      });
  }

  responseHandler(name) {
    if (name !== this.clientName) {
      this.clientDataService
        .deleteClientData(
          this.clientData,
          this.clientRecordIndex,
          this.clientKey
        )
        .then(() => {
          setTimeout(() => {
            this.clientDataService.presentToast(
              'Your changes have been saved.<br>Redirecting to Clients-list tab'
            );
            this.router.navigate(['clida', 'clients-list']);
          }, 1000);
        });
    } else {
      setTimeout(() => {
        this.clientDataService.presentToast(
          'Your changes have been saved.<br>Redirecting to Client-Details tab'
        );
        this.router.navigate([
          'clida',
          'clients-list',
          'client-details',
          this.clientKey,
        ]);
      }, 1000);
    }
  }

  async resetFieldsConfirmPopup() {
    const alert = await this.alertController.create({
      cssClass: 'alertStyle',
      header: 'Confirm',
      backdropDismiss: false,
      animated: true,
      message: 'Do you want to reset closed details?',
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
}
