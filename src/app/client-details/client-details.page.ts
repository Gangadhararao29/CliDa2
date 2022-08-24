import { Component, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, IonAccordionGroup } from '@ionic/angular';
import { ClientDataService } from 'src/app/services/client-data.service';

@Component({
  selector: 'app-client-details',
  templateUrl: './client-details.page.html',
  styleUrls: ['./client-details.page.scss'],
})
export class ClientDetailsPage {
  @ViewChild('modal') modal: any;
  @ViewChild(IonAccordionGroup, { static: true })
  accordionGroup: IonAccordionGroup;
  client: any;
  clientId = '';
  today = new Date()
    .toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
    .split('/')
    .reverse()
    .join('-');
  isd = Intl.NumberFormat('en-IN');
  showClosedData = false;
  hideAppprovedControls = true;
  approveDataId: any;
  approvedAmount = 0;
  hideSkeletonText: boolean;
  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private clientsDataService: ClientDataService,
    private alertController: AlertController
  ) {}

  ionViewWillEnter() {
    this.hideSkeletonText = false;
    this.clientId = this.activatedRoute.snapshot.params.key;
    this.clientsDataService.getClientByKey(this.clientId).then((res) => {
      this.client =
        JSON.stringify(this.client) !== JSON.stringify(res) ? res : this.client;
      this.hideSkeletonText = true;
    });
  }

  calculateDateDifference(startDate, endDate) {
    const timeObject = this.clientsDataService.calculateTimeperiod(
      startDate,
      endDate
    );
    return `${timeObject.y}y, ${timeObject.m}m, ${timeObject.d}d.`;
  }

  totalTimeinMonths(startDate, endDate) {
    return this.clientsDataService.calculateTimeperiod(startDate, endDate).tm;
  }

  calculateInterest(data, endDate) {
    const interestObject = this.clientsDataService.calculateInterest(
      data.principal,
      data.interest,
      data.startDate,
      endDate
    );
    return Number.parseInt(interestObject.interest.toFixed(2), 10);
  }

  openCalculator(recordId) {
    this.router.navigate(['clida', 'calculator', this.clientId, recordId]);
  }

  approveData(data) {
    this.hideAppprovedControls = true;
    this.approvedAmount = 0;
    this.approveDataId = data.id;
  }

  onSubmit(formRef) {
    if (formRef.valid) {
      const clientRecord = this.client.data.find(
        (ele) => ele.id == this.approveDataId
      );

      if (this.hideAppprovedControls) {
        clientRecord.closedOn = formRef.value.closedOn;
        clientRecord.closedAmount = formRef.value.closedAmount;
      } else {
        if (formRef.value.updateComments) {
          clientRecord.comments += clientRecord.comments ? `\n` : '';
          if (formRef.value.closeCurrentRecord) {
            clientRecord.comments += `Pending Amt: ₹ ${this.isd.format(
              this.approvedAmount - formRef.value.closedAmount
            )}`;

            clientRecord.comments += formRef.value.addNewRecord
              ? `\nNew record added.`
              : '';
          } else {
            clientRecord.comments += `Paid: ${formRef.value.closedOn
              .split('-')
              .reverse()
              .join('/')} => ₹ ${this.isd.format(
              formRef.value.closedAmount
            )}\nPending Amt: ₹ ${this.isd.format(
              this.approvedAmount - formRef.value.closedAmount
            )} `;
          }
        }

        if (formRef.value.closeCurrentRecord) {
          clientRecord.closedOn = formRef.value.closedOn;
          clientRecord.closedAmount = formRef.value.closedAmount;
          if (formRef.value.addNewRecord) {
            this.client.data.push({
              id: Date.now(),
              principal: this.approvedAmount - formRef.value.closedAmount,
              interest: clientRecord.interest,
              startDate: formRef.value.closedOn,
            });
          }
        }
      }

      this.clientsDataService.updateClientRecordByName(this.client).then(() => {
        this.clientsDataService.presentLoading();
        this.modal.dismiss();
      });
    }
  }

  editClientData(id) {
    this.router.navigate([
      'clida',
      'clients-list',
      'client-details',
      this.clientId,
      'edit-details',
      id,
    ]);
  }

  deleteData(id) {
    const clientDataIndex = this.client.data.findIndex((data) => data.id == id);
    this.presentAlertConfirm(clientDataIndex, this.client, this.clientId);
  }

  async presentAlertConfirm(clientDataIndex, clientData, key) {
    const alert = await this.alertController.create({
      header: 'Confirm',
      cssClass: 'alertStyle',
      backdropDismiss: false,
      animated: true,
      message: '<strong>Do you want to delete this record?</strong>',
      buttons: [
        {
          text: 'Yes',
          handler: () => {
            this.clientsDataService.presentLoading();
            this.clientsDataService
              .deleteClientData(clientData, clientDataIndex, key)
              .then((res) => {
                this.deleteResponseHandler(clientData.data.length);
              });
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

  deleteResponseHandler(length) {
    setTimeout(() => {
      if (length < 1) {
        this.clientsDataService.presentToast(
          'Client deleted completely. <br>Redirecting to Clients list tab'
        );
        this.router.navigate(['clida', 'clients-list']);
      } else {
        this.clientsDataService.presentToast(
          'Client record deleted successfully'
        );
        this.accordionGroup.value = undefined;
      }
    }, 1000);
  }

  getColor(detail) {
    const tm = this.clientsDataService.calculateTimeperiod(
      detail?.startDate
    ).tm;
    if (detail?.closedOn) {
      return 'success';
    } else if (tm >= 30) {
      return 'danger';
    } else if (tm >= 24) {
      return 'warning';
    } else {
      return 'light';
    }
  }

  onchangeClosedDetails(event, data, closedOn?) {
    if (event.target.name === 'closedOn') {
      this.approvedAmount =
        data.principal + this.calculateInterest(data, event.target.value);
    }

    if (event.target.name === 'closedAmount') {
      this.approvedAmount =
        data.principal + this.calculateInterest(data, closedOn.value);
      if (Math.round(event.target.value) !== Math.round(this.approvedAmount)) {
        this.hideAppprovedControls = false;
      } else {
        this.hideAppprovedControls = true;
      }
    }
  }

  stopDefaultSubmit(e) {
    if (e.keyCode == 13) {
      e.preventDefault();
    }
  }
}
