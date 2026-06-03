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
  renameAllRecords: boolean = true;
  splitMode: boolean = false;
  splitAmounts = {
    first: 0,
    second: 0,
  };
  sliderValue: number = 50; // percentage (0-100)
  constructor(
    private activatedRoute: ActivatedRoute,
    public alertController: AlertController,
    private router: Router,
    private dataBaseService: DataBaseService,
    private commonService: CommonService,
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
          (row) => row.id == params.clientId,
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

  toggleSplitMode() {
    if (this.clientRecord.closedOn) {
      return;
    }

    const total = Math.abs(this.clientRecord.principal || 0);
    if (!total) {
      this.commonService.presentToast(
        'You need a valid principal amount before splitting.',
        'failedToastClass',
        'alert-circle',
      );
      return;
    }

    this.splitMode = !this.splitMode;

    if (this.splitMode) {
      // initialize slider to 50% and split amounts to equal halves
      this.sliderValue = 50;
      const half = Math.round((total / 2) * 100) / 100;
      this.splitAmounts.first = half;
      this.splitAmounts.second = half;
    }
  }

  onSliderChange(event: any) {
    const total = Math.abs(this.clientRecord.principal || 0);
    const percent =
      typeof event === 'number'
        ? event
        : Number(event?.detail?.value ?? this.sliderValue ?? 0);
    this.sliderValue = percent;
    const first = Math.round((percent / 100) * total * 100) / 100;
    const second = Math.round((total - first) * 100) / 100;
    this.splitAmounts.first = first;
    this.splitAmounts.second = second;
  }

  displayTotalPrincipal() {
    return (
      Math.abs(this.splitAmounts.first || 0) +
      Math.abs(this.splitAmounts.second || 0)
    );
  }

  onSubmit(formRef) {
    if (formRef.valid) {
      this.presentAlertConfirm(formRef);
    } else {
      this.commonService.presentToast(
        'Please fill all the required fields.',
        'failedToastClass',
        'alert-circle',
      );
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
            this.commonService.presentLoading('Saving...', 1000);
            this.saveRecord(formRef.value);
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

  async splitRecord(formData) {
    const total = Math.abs(this.clientRecord.principal || 0);
    const first = Number(this.splitAmounts.first);
    const second = Number(this.splitAmounts.second);
    const sum = first + second;
    const tolerance = 0.001;

    if (!first || !second || Math.abs(sum - total) > tolerance) {
      this.commonService.presentToast(
        'Split amounts must be valid and total the original principal.',
        'failedToastClass',
        'alert-circle',
      );
      return;
    }

    if (formData.userName != this.clientName) {
      this.commonService.presentToast(
        'Please save name changes before splitting this record.',
        'failedToastClass',
        'alert-circle',
      );
      return;
    }

    const sign = formData.recordType === 'credit' ? 1 : -1;
    const firstPrincipal = sign * first;
    const secondPrincipal = sign * second;

    const currentPayload = this.generatePayload(formData);
    currentPayload.principal = firstPrincipal;

    const secondRecord = {
      id: Date.now() + 1,
      principal: secondPrincipal,
      interest: formData.interest,
      startDate: formData.startDate,
      comments: formData.comments,
    };

    await this.commonService.presentLoading('Splitting record...', 1000);
    await this.dataBaseService.saveClientRecord(
      currentPayload,
      this.clientData,
    );
    await this.dataBaseService.createDataRecords({
      name: formData.userName,
      data: [secondRecord],
    });

    this.commonService.presentToast(
      'The record has been split into two entries.',
      'successToastClass',
      'checkmark-circle',
    );

    this.router.navigate(['clients-list', 'client-details', this.clientKey]);
  }

  generatePayload(record) {
    const principalValue =
      record.principal !== undefined
        ? record.principal
        : this.clientRecord.principal;
    return {
      name: record.userName,
      principal:
        record.recordType === 'credit'
          ? Math.abs(principalValue)
          : -Math.abs(principalValue),
      interest: record.interest,
      startDate: record.startDate,
      closedAmount: record.closedAmount || null,
      closedOn: record.closedOn || null,
      comments: record.comments,
      id: this.clientRecordId,
      key: this.clientKey,
      index: this.clientRecordIndex,
    };
  }

  saveRecord(formData) {
    if (this.splitMode) {
      this.splitRecord(formData);
      return;
    }

    const payload = this.generatePayload(formData);

    if (formData.userName != this.clientName) {
      payload['renameAllRecords'] = this.renameAllRecords;

      this.dataBaseService
        .handleRecordTransfer(payload, this.clientData)
        .then((res) => {
          this.responseHandler(res.data);
        });
    } else {
      this.dataBaseService
        .saveClientRecord(payload, this.clientData)
        .then((res) => {
          this.responseHandler(res.data);
        });
    }
  }

  responseHandler(records) {
    if (records.data?.length) {
      setTimeout(() => {
        this.commonService.presentToast(
          'Your changes have been saved successfully.<br>Redirecting to the Client Details tab.',
        );
        this.router.navigate([
          'clients-list',
          'client-details',
          this.clientKey,
        ]);
      }, 1000);
    } else {
      setTimeout(() => {
        this.commonService.presentToast(
          'Your changes have been saved successfully.<br>Redirecting to the Clients List tab.',
        );
        this.router.navigate(['clients-list']);
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
