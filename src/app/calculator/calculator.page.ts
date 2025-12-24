import { Component, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Share } from '@capacitor/share';
import { CommonService } from '../services/common.service';
import { DataBaseService } from '../services/data-base.service';
import { CalculationService } from '../services/calculation.service';

@Component({
  selector: 'app-calculator',
  templateUrl: './calculator.page.html',
  styleUrls: ['./calculator.page.scss'],
  standalone: false,
})
export class CalculatorPage {
  @ViewChild('calcHistory') calcsHistoryComp;
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
  calcsHistory = [];
  presentObj = { data: [] } as any;

  constructor(
    private activatedRoute: ActivatedRoute,
    private dataBaseService: DataBaseService,
    private commonService: CommonService,
    private calculationService: CalculationService
  ) {}

  ionViewWillEnter() {
    this.theme = this.commonService.getTheme();
    this.calcsHistory = JSON.parse(localStorage.getItem('calcsHistory')) || [];

    const clientID = this.activatedRoute.snapshot.params.key;
    const recordId = this.activatedRoute.snapshot.params.id;

    if (clientID !== '0') {
      this.dataBaseService.getClientByKey(clientID).then((res) => {
        this.presentObj = res;
        this.linkData = res.data.find((record) => record.id == recordId);
        this.linkData.name = res.name;
        this.linkData.endDate =
          this.linkData.closedOn || this.commonService.today;
        this.linkData.timePeriodType = 'dates';
        this.linkData.compInt = 3;
      });
    } else {
      this.linkData.endDate = this.commonService.today;
      this.linkData.timePeriodType = 'dates';
      this.linkData.compInt = 3;
    }
  }

  changeCalcData(clientDetail?: any) {
    if (clientDetail) {
      this.linkData = clientDetail;
      this.linkData.name = clientDetail?.name || this.presentObj?.name || '';
      this.linkData.endDate =
        this.linkData.closedOn || this.commonService.today;
    } else {
      this.linkData = {
        timePeriod: { d: null, m: null, y: null },
        endDate: this.commonService.today,
      };
    }

    this.linkData.timePeriodType = 'dates';
    this.linkData.compInt = 3;
    this.showCalculatedData = false;
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

  generateStartEndDate(formRefValue: any): void {
    this.timePeriodObject.d = this.timePeriodObject.d || 0;
    this.timePeriodObject.m = this.timePeriodObject.m || 0;
    this.timePeriodObject.y = this.timePeriodObject.y || 0;

    const { y, m, d } = this.timePeriodObject;

    if (this.linkData.startDate) {
      const startDate = new Date(this.linkData.startDate);
      formRefValue.startDate = startDate;
      formRefValue.endDate = new Date(
        startDate.getFullYear() + y,
        startDate.getMonth() + m,
        startDate.getDate() + d
      );
    } else {
      const endDate = this.linkData.endDate
        ? new Date(this.linkData.endDate)
        : new Date();
      formRefValue.startDate = new Date(
        endDate.getFullYear() - y,
        endDate.getMonth() - m,
        endDate.getDate() - d
      );
      formRefValue.endDate = endDate;
    }
  }

  dateFormatter(date: Date): string {
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
          this.linkData.startDate = this.dateFormatter(formRef.value.startDate);
          this.linkData.endDate = this.dateFormatter(formRef.value.endDate);
        }
      } else {
        this.timePeriodObject = this.calculationService.calculateTimePeriod(
          formRef.value.startDate,
          formRef.value.endDate
        );
      }

      if (!isNaN(this.timePeriodObject.tm)) {
        this.intArray = this.calculationService.calculateTotalInterest(
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
        this.commonService.presentToast(
          'The interest has been calculated successfully.'
        );
      } else {
        this.showCalculatedData = false;
        this.dateInputErrorAlert(formRef.timePeriodType === 'dates');
      }

      this.saveCalcLogs(this.finalInterest);
    }
  }

  saveCalcLogs(finalInterest) {
    if (this.calcsHistory[0]?.key == this.commonService.today) {
    } else {
      this.calcsHistory.unshift({
        key: this.commonService.today,
        value: [],
      });
    }

    const historyArr = this.calcsHistory[0].value;

    const index = historyArr.findIndex((calc) => {
      return (
        calc.principal === this.linkData.principal &&
        calc.interest === this.linkData.interest &&
        calc.startDate === this.linkData.startDate &&
        calc.endDate === this.linkData.endDate
      );
    });

    if (index > -1) {
      historyArr.splice(index, 1);
    }

    historyArr.unshift({
      ...this.linkData,
      id: this.linkData.id || Date.now(),
      finalInterest,
    });

    this.calcsHistory[0].value = historyArr;

    const text = JSON.stringify(this.calcsHistory);
    localStorage.setItem('calcsHistory', text);
  }

  resetForm(formRef) {
    formRef.resetForm();
    formRef.form.controls.timePeriodType.setValue('dates');
    formRef.form.controls.compInt.setValue(3);
    setTimeout(() => {
      formRef.form.controls.startDate.setValue(null);
      formRef.form.controls.endDate.setValue(this.commonService.today);
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
      : 'At least one of the time period should be greater than 0.';
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
      await Share.share({
        text: clipboardText,
      });
    } catch {
      const cb = navigator.clipboard;
      await cb.writeText(clipboardText);
      this.commonService.presentToast(
        'The data has been copied to the clipboard successfully.'
      );
    }
  }

  loadHistory(eventData) {
    this.changeCalcData(eventData);
  }

  openHistory() {
    this.calcsHistoryComp.openModal();
  }

  // prettier-ignore
  generateResultHtml() {
  const {
    principal,
    interest,
    startDate,
    endDate
  } = this.linkData;

  const { y, m, d, tm } = this.timePeriodObject;
  const separator = `--------------------------------`;

  const lines: string[] = [
    `${'Principal'.padEnd(15)}: ${this.currencyFormat(principal)}`,
    `${'Interest rate'.padEnd(15)}: ${interest}`,
    `${'End date'.padEnd(15)}: ${endDate}`,
    `${'Start date'.padEnd(15)}: ${startDate}`,
    `${separator}`,
    `${'Time period'.padEnd(15)}: ${y} y ${m} m ${d} d`,
    `${separator}`,
    `${'Time in months'.padEnd(15)}: ${tm.toFixed(2)}`
  ];

  if (this.intArray.length === 1) {
    const interestAmt = this.intArray[0].intAmt;

    lines.push(
      `${'Total interest'.padEnd(15)}: ${this.currencyFormat(interestAmt)}`,
      `${separator}`,
      `${'Total amount'.padEnd(15)}: ${this.currencyFormat(interestAmt + principal)}`
    );
  } else {
    lines.push('Interest breakdown');
    this.intArray.forEach(({ start, end, intAmt }) => {
      lines.push(
        `${start}y - ${(+end).toFixed(2)}y     : ${this.currencyFormat(intAmt)}`,
      );
    });

    lines.push(
      `${'Total interest'.padEnd(15)}: ${this.currencyFormat(this.finalInterest)}`,
      `${separator}`,
      `${'Total amount'.padEnd(15)}: ${this.currencyFormat(this.finalInterest + principal)}`
    );
  }

  lines.push(
    `${separator}`,
    `https://clida3.web.app/calculator`
  );

  return lines.join('\n');
}
}
