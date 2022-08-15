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
  showCloseDiv = false;
  showClosedData = false;
  approveDataId: any;
  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private clientsDataService: ClientDataService,
    private alertController: AlertController
  ) {}

  ionViewWillEnter() {
    this.activatedRoute.params.subscribe((params) => {
      this.clientId = params.key;
      this.clientsDataService.getClientByKey(params.key).then((res) => {
        this.client = res;
      });
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

  calculateInterest(data) {
    const interestObject = this.clientsDataService.calculateInterest(
      data.principal,
      data.interest,
      data.startDate,
      this.today
    );
    return Number.parseInt(interestObject.interest.toFixed(2), 10);
  }

  openCalculator(recordId) {
    this.router.navigate(['clida', 'calculator', this.clientId, recordId]);
  }

  approveData(id) {
    this.showCloseDiv = !this.showCloseDiv;
    this.approveDataId = id;
  }

  onSubmit(formRef) {
    if (formRef.valid) {
      this.client.data.forEach((ele) => {
        if (ele.id == this.approveDataId) {
          ele.closedOn = formRef.value.closedOn;
          ele.closedAmount = formRef.value.closedAmount;
        }
      });
      this.clientsDataService.updateClientRecordByName(this.client).then(() => {
        this.showCloseDiv = false;
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
}
