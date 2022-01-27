import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import { ClientDataService } from 'src/app/services/client-data.service';

@Component({
  selector: 'app-client-details',
  templateUrl: './client-details.page.html',
  styleUrls: ['./client-details.page.scss'],
})
export class ClientDetailsPage {
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
    private alertController: AlertController,
    private toastController: ToastController
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
    return `${timeObject.d}d, ${timeObject.m}m, ${timeObject.y}y.`;
  }

  totalTimeinMonths(startDate, endDate) {
    return this.clientsDataService.calculateTimeperiod(startDate, endDate).tm;
  }

  calculateInterest(data) {
    const timeObject = this.clientsDataService.calculateTimeperiod(
      data.startDate,
      this.today
    );
    const interestObject = this.clientsDataService.calcaulateInterest(
      data.principal,
      timeObject.tm,
      data.interest
    );
    return Number.parseInt(interestObject.interest.toFixed(2), 10);
  }

  openCalculator(recordId) {
    this.router.navigate(['clida', 'calculator', this.clientId, recordId]);
  }

  approveData(id) {
    this.showCloseDiv = true;
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
      this.clientsDataService.updateClientRecordByName(this.client);
      this.showCloseDiv = false;
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
    const clientDataLength = this.client.data.length;
    this.presentAlertConfirm(clientDataIndex, clientDataLength);
  }

  async presentAlertConfirm(clientDataIndex, dataLength) {
    const alert = await this.alertController.create({
      header: 'Confirm!',
      message: '<strong>Do you want to delete this record?</strong>',
      buttons: [
        {
          text: 'No',
          role: 'cancel',
          cssClass: 'secondary',
        },
        {
          text: 'Yes',
          handler: () => {
            this.client.data.splice(clientDataIndex, 1);
            if (dataLength == 1) {
              this.clientsDataService.deleteClient(this.clientId);
              this.presentToast(
                'Client deleted completely. <br>Redirecting to Clients list tab',
                2500
              );
              setTimeout(() => {
                this.router.navigate(['clida', 'clients-list']);
              }, 2000);
            } else {
              this.clientsDataService.updateClientRecordByName(this.client);
              this.presentToast('Client record deleted successfully', 2500);
            }
          },
        },
      ],
    });

    await alert.present();
  }

  async presentToast(message, duration) {
    const toast = await this.toastController.create({
      message,
      duration,
      position: 'top',
    });
    toast.present();
  }
}
