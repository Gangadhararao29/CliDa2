import { Component, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { CommonService } from '../services/common.service';
import { DataBaseService } from '../services/data-base.service';

@Component({
  selector: 'app-edit-details',
  templateUrl: './edit-details.page.html',
  styleUrls: ['./edit-details.page.scss'],
  standalone: false,
})
export class EditDetailsPage {
  @ViewChild('formRef') formRefVariable: any;
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
  theme: string;
  constructor(
    private activatedRoute: ActivatedRoute,
    public alertController: AlertController,
    private router: Router,
    private dataBaseService: DataBaseService,
    private commonService: CommonService
  ) {}

  ionViewWillEnter() {
    this.theme = this.commonService.getTheme();
    this.activatedRoute.params.subscribe((params) => {
      this.clientKey = params.key;
      this.clientRecordId = params.clientId;
      this.dataBaseService.getClientByKey(params.key).then((record) => {
        this.clientData = record;
        this.clientName = record.name;
        this.clientRecordIndex = record.data.findIndex(
          (row) => row.id == params.clientId
        );
        this.clientRecord = { ...this.clientData.data[this.clientRecordIndex] };
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

  changeRadio(event) {
    this.formRefVariable.form.controls.recordType.setValue(event);
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
      header: 'Save changes?',
      message: 'Do you want to save your changes?',
      backdropDismiss: false,
      animated: true,
      buttons: [
        {
          text: 'Save',
          cssClass: 'bg-success',
          handler: () => {
            this.commonService.presentLoading();
            this.saveClientsData(formRef);
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

  saveClientsData(formRef) {
    this.dataBaseService
      .editClientData(formRef.value, this.clientData, this.clientRecordIndex)
      .then((res) => {
        this.responseHandler(res.data.name);
      });
  }

  responseHandler(name) {
    if (name !== this.clientName) {
      this.dataBaseService
        .deleteClientData(
          this.clientData,
          this.clientRecordIndex,
          this.clientKey
        )
        .then(() => {
          setTimeout(() => {
            this.commonService.presentToast(
              'Your changes have been saved successfully.<br>Redirecting to the Clients List tab.'
            );
            this.router.navigate(['clients-list']);
          }, 1000);
        });
    } else {
      setTimeout(() => {
        this.commonService.presentToast(
          'Your changes have been saved successfully.<br>Redirecting to the Client Details tab.'
        );
        this.router.navigate([
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
      header: 'Reset closed details?',
      message: 'This will clear the closed date and amount.',
      backdropDismiss: false,
      animated: true,
      buttons: [
        {
          text: 'Reset',
          cssClass: 'bg-danger',
          handler: () => {
            this.clientRecord.closedOn = null;
            this.clientRecord.closedAmount = 0;
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
}
