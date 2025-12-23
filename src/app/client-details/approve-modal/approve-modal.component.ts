import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { DataBaseService } from '../../services/data-base.service';
import { CommonService } from '../../services/common.service';
import { CalculationService } from '../../services/calculation.service';

@Component({
  selector: 'app-approve-modal',
  templateUrl: './approve-modal.component.html',
  styleUrls: ['./approve-modal.component.scss'],
  standalone: false,
})
export class ApproveModalComponent implements OnInit {
  @Input() data: any;
  @Input() client: any;

  approveDataId: any;
  hideAppprovedControls = true;
  approvedAmount = 0;
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
  theme: string;


  constructor(
    private modalController: ModalController,
    private dataBaseService: DataBaseService,
    private commonService: CommonService,
    private calculationService: CalculationService
  ) {}

  ngOnInit() {
    this.theme = this.commonService.getTheme();
    this.hideAppprovedControls = true;
    this.approvedAmount = 0;
  }

  onSubmit(formRef) {
    if (formRef.valid) {
      const oldData = { ...this.data };
      const index = this.client.data.findIndex((res) => res.id === oldData.id);

      if (this.hideAppprovedControls || formRef.value.closeCurrentRecord) {
        this.client.data[index].closedOn = formRef.value.closedOn;
        this.client.data[index].closedAmount = formRef.value.closedAmount;

        if (formRef.value.addNewRecord) {
          this.client.data.push({
            id: Date.now(),
            principal: this.approvedAmount - formRef.value.closedAmount,
            interest: this.client.data[index].interest,
            startDate: formRef.value.closedOn,
          });
        }
      }

      if (!this.hideAppprovedControls && formRef.value.updateComments) {
        const paymentDetails = `Paid ₹ ${this.isd.format(
          formRef.value.closedAmount
        )} on ${formRef.value.closedOn.split('-').reverse().join('/')}`;
        const balanceAmount = `Balance Amt: ₹ ${this.isd.format(
          this.approvedAmount - formRef.value.closedAmount
        )}`;
        const newRecordAdded =
          formRef.value.addNewRecord && formRef.value.closeCurrentRecord
            ? '\nNew record added.'
            : '';

        this.client.data[index].comments = `${
          this.client.data[index].comments
            ? this.client.data[index].comments + '\n'
            : ''
        }${paymentDetails}\n${balanceAmount}${newRecordAdded}`;
      }

      this.commonService.presentLoading();
      this.dataBaseService
        .approveClientData(this.client, oldData, index)
        .then(() => {
          this.modalController.dismiss();
          this.commonService.pageRefreshEmitter.next(this.client);
        });
    }
  }

  dismissModal() {
    this.modalController.dismiss();
  }

  calculateClosedDetails(event, data, closedOn?) {
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

  stopDefaultSubmit(e) {
    if (e.keyCode == 13) {
      e.preventDefault();
    }
  }
}
