import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ClientDataService } from '../services/client-data.service';
import { Clipboard } from '@capacitor/clipboard';

@Component({
  selector: 'app-calculator',
  templateUrl: './calculator.page.html',
  styleUrls: ['./calculator.page.scss'],
})
export class CalculatorPage {
  linkData = {
    timePeriod: { d: null, m: null, y: null },
  } as any;
  timePeriodObject = { d: null, m: null, y: null, tm: null };
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
        this.linkData.timePeriodType = 'dates';
        this.linkData.compInt = 3;
      });
    } else {
      this.linkData.endDate = this.clientsDataService.today;
      this.linkData.timePeriodType = 'dates';
      this.linkData.compInt = 3;
    }
  }

  generateTmFromPeriod(): number {
    if (
      this.timePeriodObject.d ||
      this.timePeriodObject.m ||
      this.timePeriodObject.y
    ) {
      return (
        +this.timePeriodObject.y * 12 +
        +this.timePeriodObject.m +
        +this.timePeriodObject.d / 30
      );
    }
    return NaN;
  }

  generateStartEndDate(formRefValue) {
    const endDate = new Date(this.linkData.endDate);
    formRefValue.endDate = endDate;
    formRefValue.startDate = new Date(endDate);
    formRefValue.startDate.setDate(
      formRefValue.startDate.getDate() - this.timePeriodObject.d
    );
    formRefValue.startDate.setMonth(
      formRefValue.startDate.getMonth() - this.timePeriodObject.m
    );
    formRefValue.startDate.setFullYear(
      formRefValue.startDate.getFullYear() - this.timePeriodObject.y
    );
  }

  dateFormater(date: Date): string {
    return date
      .toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
      .split('/')
      .reverse()
      .join('-');
  }

  onSubmit(formRef) {
    if (formRef.valid) {
      if (formRef.value.timePeriodType === 'period') {
        this.timePeriodObject.tm = this.generateTmFromPeriod();
        this.generateStartEndDate(formRef.value);

        if (!isNaN(this.timePeriodObject.tm)) {
          this.linkData.startDate = this.dateFormater(formRef.value.startDate);
          this.linkData.endDate = this.dateFormater(formRef.value.endDate);
        }
      } else {
        this.timePeriodObject = this.clientsDataService.calculateTimeperiod(
          formRef.value.startDate,
          formRef.value.endDate
        );
      }

      if (!isNaN(this.timePeriodObject.tm)) {
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
        this.dateInputErrorAlert(formRef.timePeriodType === 'dates');
      }
    }
  }

  resetForm(formRef) {
    formRef.resetForm();
    formRef.form.controls.timePeriodType.setValue('dates');
    formRef.form.controls.compInt.setValue(3);
    setTimeout(() => {
      formRef.form.controls.startDate.setValue(null);
      formRef.form.controls.endDate.setValue(this.clientsDataService.today);
    });
    this.showCalculatedData = false;
  }

  dateInputErrorAlert(isDateType) {
    const alert = document.createElement('ion-alert');
    alert.cssClass = 'alertStyle';
    alert.header = isDateType
      ? 'Please check the dates'
      : 'Please check the time period';
    alert.message = isDateType
      ? 'The end date should be greater than the start date.'
      : 'Atleast one of the time period should be greater than 0.';
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

  async shareToClipboard() {
    const clipboardText = this.generateResultHtml();
    try {
      await Clipboard.write({
        string: clipboardText,
      });
      this.clientsDataService.presentToast('Copied to clipboard successfully.');
    } catch (error) {
      this.clientsDataService.presentToast(
        error.message,
        'failedToastClass',
        'alert-outline'
      );
    }
  }

  // prettier-ignore
  generateResultHtml(){
    let text = '';
    text += 'Principal      : ' + this.currencyFormat(this.linkData.principal) + '\n';
    text += 'Interest rate  : ' + this.linkData.interest + '\n';
    text += 'End date       : ' + this.linkData.endDate + '\n';
    text += 'Start date     : ' + this.linkData.startDate + '\n';
    text += '------------------------------\n';
    text += 'Time period    : ' + `${this.timePeriodObject.y} y ${this.timePeriodObject.m} m ${this.timePeriodObject.d} d` + '\n';
    text += '------------------------------\n';

    text += 'Time in months : ' + this.timePeriodObject.tm.toFixed(2) + '\n';

    if(this.intArray.length ===1){
    text += 'Total interest : ' + this.currencyFormat(this.intArray[0].intAmt) + '\n';
    text += '------------------------------\n';
    text += 'Total amount   : ' + this.currencyFormat(this.intArray[0].intAmt + this.linkData.principal) + '\n';
    }else{
      this.intArray.forEach(intObj=>{
    text += `Int amount (${intObj.start} - ${(+intObj.end).toFixed(2)})y : ` + this.currencyFormat(intObj.intAmt) + '\n';
      })
    text += 'Total interest : ' + this.currencyFormat(this.finalInterest) + '\n';
    text += '------------------------------\n';
    text += 'Total amount   : ' + this.currencyFormat(this.finalInterest + this.linkData.principal) + '\n';
    }
    text += '------------------------------\n';
    text += 'Calculated by \n - https://clida3.web.app/calculator';
    return text;
  }
}
