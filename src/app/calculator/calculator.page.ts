import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ClientDataService } from '../services/client-data.service';

@Component({
  selector: 'app-calculator',
  templateUrl: './calculator.page.html',
  styleUrls: ['./calculator.page.scss'],
})
export class CalculatorPage {
  linkData = {} as any;
  timePeriodObject: { d: number; m: number; y: number; tm: number };
  interestObj = {} as any;
  advIntShow = false;
  showCalculatedData = false;
  intArray = [];
  finalInterest = 0;
  theme: string;

  constructor(
    private activatedRoute: ActivatedRoute,
    private clientsDataService: ClientDataService
  ) {}

  ionViewWillEnter() {
    this.theme = this.clientsDataService.getTheme();
    const clientID = this.activatedRoute.snapshot.params.key;
    const recordId = this.activatedRoute.snapshot.params.id;

    if (clientID !== '0') {
      this.clientsDataService.getClientByKey(clientID).then((res) => {
        this.linkData = res.data.find((record) => record.id == recordId);
        this.linkData.name = res.name;
        this.linkData.endDate = this.clientsDataService.today;
        this.linkData.compInt = 3;
      });
    } else {
      this.linkData.endDate = this.clientsDataService.today;
      this.linkData.compInt = 3;
    }
  }

  onSubmit(formRef) {
    if (formRef.valid) {
      this.timePeriodObject = this.clientsDataService.calculateTimeperiod(
        formRef.value.startDate,
        formRef.value.endDate
      );

      if (!isNaN(this.timePeriodObject.d)) {
        this.intArray = this.clientsDataService.calculateTotalInterest(
          {
            principal: formRef.value.principal,
            rate: formRef.value.interest,
            startDate: formRef.value.startDate,
          },
          formRef.value.endDate,
          formRef.value.compInt
        );
        this.finalInterest = this.intArray.reduce(
          (prev, curr) => prev + curr.intAmt,
          0
        );

        this.showCalculatedData = true;
        this.clientsDataService.presentToast(
          'Interest calculated successfully'
        );
      } else {
        this.showCalculatedData = false;
        this.dateInputErrorAlert();
      }
    }
  }

  resetForm(formRef) {
    formRef.resetForm();
    formRef.form.controls.endDate.setValue(this.clientsDataService.today);
    formRef.form.controls.compInt.setValue(3);
    this.showCalculatedData = false;
  }

  dateInputErrorAlert() {
    const alert = document.createElement('ion-alert');
    alert.cssClass = 'alertStyle';
    alert.header = 'Please check the dates';
    alert.message = 'The end date should be greater than the start date.';
    alert.buttons = ['Ok'];
    document.body.appendChild(alert);
    return alert.present();
  }

  currencyFormat(value) {
    const formattedValue = new Intl.NumberFormat('en-IN').format(
      Math.round(value * 100) / 100
    );
    return `₹ ${formattedValue}`;
  }
}
