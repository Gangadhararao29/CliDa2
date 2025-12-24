import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { DataBaseService } from '../../services/data-base.service';
import { CalculationService } from '../../services/calculation.service';
import { CommonService } from '../../services/common.service';

@Component({
  selector: 'app-client-data-view',
  templateUrl: './client-data-view.component.html',
  styleUrls: ['./client-data-view.component.scss'],
  standalone: false,
})
export class ClientDataViewComponent implements OnInit {
  @Input() data: any;
  @Input() client: any;
  @Input() index: string | number;
  @Output() cleanUp = new EventEmitter<void>();

  isd = Intl.NumberFormat('en-IN');
  today = new Date()
    .toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
    .split('/')
    .reverse()
    .join('-');

  constructor(
    private router: Router,
    private alertController: AlertController,
    private dataBaseService: DataBaseService,
    private calculationService: CalculationService,
    private commonService: CommonService
  ) {}

  ngOnInit() {}

  calculateDateDifference(startDate, endDate) {
    const timeObject = this.calculationService.calculateTimePeriod(
      startDate,
      endDate
    );
    return `${timeObject.y}y, ${timeObject.m}m, ${timeObject.d}d`;
  }

  totalTimeInMonths(startDate, endDate) {
    return (
      Math.round(
        this.calculationService.calculateTimePeriod(startDate, endDate).tm * 100
      ) / 100.0
    );
  }

  calculateInterest(data, endDate) {
    const intArr = this.calculationService.calculateTotalInterest(
      {
        principal: data.principal,
        rate: data.interest,
        startDate: data.startDate,
      },
      endDate
    );
    return Math.round(intArr[0].intAmt * 100) / 100;
  }

  openCalculator(recordId) {
    this.router.navigate(['calculator', this.client.id, recordId]);
  }

  editClientData(id) {
    this.router.navigate([
      'clients-list',
      'client-details',
      this.client.id,
      'edit-details',
      id,
    ]);
  }

  deleteData(id) {
    const clientDataIndex = this.client.data.findIndex((data) => data.id == id);
    this.presentAlertConfirm(clientDataIndex, this.client, this.client.id);
  }
  async presentAlertConfirm(clientDataIndex, clientData, key) {
    const alert = await this.alertController.create({
      header: 'Delete record?',
      message: 'This will be deleted permanently.',
      cssClass: 'alertStyle',
      backdropDismiss: false,
      animated: true,
      buttons: [
        {
          text: 'Delete',
          role: 'submit',
          cssClass: 'bg-danger',
          handler: () => {
            this.commonService.presentLoading();
            this.dataBaseService
              .deleteClientData(clientData, clientDataIndex, key)
              .then(() => {
                this.deleteResponseHandler(clientData.data.length);
              });
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

  deleteResponseHandler(length) {
    setTimeout(() => {
      if (length < 1) {
        this.commonService.presentToast(
          'The client has been deleted completely.<br>Redirecting to the Clients List tab.'
        );
        this.router.navigate(['clients-list']);
      } else {
        this.commonService.presentToast('The client record has been deleted successfully.');

        this.cleanUp.emit();
      }
    }, 1000);
  }
}
