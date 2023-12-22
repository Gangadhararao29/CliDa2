import { Component, QueryList, ViewChild, ViewChildren } from '@angular/core';
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
  @ViewChildren('modal')
  modals: QueryList<any>;
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
  hideSkeletonText: boolean;
  totalAmount = 0;
  theme: string;
  selectedChips = [];

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private clientsDataService: ClientDataService,
    private alertController: AlertController
  ) {}

  ionViewWillEnter() {
    this.selectedChips = [];
    this.hideSkeletonText = false;
    this.theme = this.clientsDataService.getTheme();
    this.clientId = this.activatedRoute.snapshot.params.key;
    this.clientsDataService.getClientByKey(this.clientId).then((res) => {
      this.client = res;
      this.calculateTotalPrincipal(this.client);
      this.hideSkeletonText = true;
    });
  }

  trackData(index, record) {
    return record.id;
  }

  calculateTotalPrincipal(res) {
    this.totalAmount = res.data.reduce(
      (a, b) =>
        a + (b.hasOwnProperty('closedOn') && b.closedOn ? 0 : b.principal),
      0
    );
  }

  calculateDateDifference(startDate, endDate) {
    const timeObject = this.clientsDataService.calculateTimeperiod(
      startDate,
      endDate
    );
    return `${timeObject.y}y, ${timeObject.m}m, ${timeObject.d}d`;
  }

  totalTimeinMonths(startDate, endDate) {
    return (
      Math.round(
        this.clientsDataService.calculateTimeperiod(startDate, endDate).tm * 100
      ) / 100.0
    );
  }

  calculateInterest(data, endDate) {
    const intArr = this.clientsDataService.calculateTotalInterest(
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
    this.router.navigate(['calculator', this.clientId, recordId]);
  }

  editClientData(id) {
    this.router.navigate([
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
      message: 'Do you want to delete this record?',
      buttons: [
        {
          text: 'Yes',
          handler: () => {
            this.clientsDataService.presentLoading();
            this.clientsDataService
              .deleteClientData(clientData, clientDataIndex, key)
              .then(() => {
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
          'Client deleted completely.<br>Redirecting to Clients-list tab'
        );
        this.router.navigate(['clients-list']);
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
    } else if (tm >= 12) {
      return 'primary';
    } else {
      return 'dark';
    }
  }

  ionViewWillLeave() {
    this.modals.toArray().forEach((element) => {
      if (element.isCmpOpen) element.dismiss();
    });
  }

  onChipClick(data) {
    const isChipSelectedIndex = this.selectedChips.findIndex(
      (chip) => chip.id === data.id
    );

    if (isChipSelectedIndex !== -1) {
      this.selectedChips.splice(isChipSelectedIndex, 1);
    } else {
      const calculatedObj = {
        id: data.id,
        principal: data.principal,
        interest: this.calculateInterest(data, new Date()),
      };
      this.selectedChips.push(calculatedObj);
    }
  }

  toggleTotalChips() {
    const totalRows = this.client.data.filter((record) => !record.closedOn);
    if (totalRows.length !== this.selectedChips.length) {
      totalRows.forEach((rec) => {
        if (!this.getChipColor(rec.id)) {
          this.onChipClick(rec);
        }
      });
    } else {
      this.selectedChips = [];
    }
  }

  getChipColor(id) {
    return this.selectedChips.find((chip) => chip.id == id) ? true : false;
  }

  getTotalSelectedAmount() {
    let total = 0;
    this.selectedChips.forEach(
      (chip) => (total += chip.principal + chip.interest)
    );
    return `₹ ${this.isd.format(total)}`;
  }

  onCheckBoxClick(event, data) {
    event.stopPropagation();
    this.onChipClick(data);
  }
}
