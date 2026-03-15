import { Component, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, IonItemSliding } from '@ionic/angular';
import { NgForm } from '@angular/forms';
import { CommonService } from '../services/common.service';
import { LeaseService } from '../services/lease.service';
import { CalculationResult, LeaseClient } from './models/leaseClient.model';
import { CalculationService } from '../services/calculation.service';
import { Share } from '@capacitor/share';

@Component({
  selector: 'app-calculator2',
  templateUrl: './calculator2.page.html',
  styleUrls: ['./calculator2.page.scss'],
  standalone: false,
})
export class Calculator2Page {
  @ViewChild('notesSection') notesSection: ElementRef;
  @ViewChild('formRef') formRef: NgForm;
  theme: string;
  leaseClients: Array<LeaseClient> = [];
  activeLease: LeaseClient = null;
  pendingYears: Array<number> = [];
  isHistoryOpen = false;
  isNewTransaction = false;
  calculationResults: Array<CalculationResult> = [];
  finalAmount = 0;
  showLeaseCalculatedData = false;
  rawDate = new Date();
  today: string;

  constructor(
    private router: Router,
    private commonService: CommonService,
    private leaseService: LeaseService,
    private calculationService: CalculationService,
    private alertController: AlertController,
  ) {}

  ionViewWillEnter() {
    this.theme = this.commonService.getTheme();
    this.today = this.commonService.today;
    this.initializeYearOptions();
    this.leaseClients = this.leaseService.getLeaseClients();

    if (this.leaseClients?.length > 0) {
      this.activeLease = this.activeLease ?? this.leaseClients[0];
      this.isHistoryOpen = true;
    } else {
      this.activeLease = this.activeLease ?? this.createLeaseClient();
      this.isHistoryOpen = false;
      this.isNewTransaction = true;
    }
  }

  initializeYearOptions() {
    let currentYear = this.rawDate.getFullYear();
    if (this.rawDate.getMonth() < 7) {
      currentYear--;
    }
    this.pendingYears = Array.from({ length: 5 }, (_, i) => currentYear - i);
  }

  setActiveLease(client: LeaseClient) {
    const isSameClient = this.activeLease?.id == client.id;
    this.activeLease = isSameClient ? null : client;
    this.isNewTransaction = false;
    this.isHistoryOpen = !isSameClient;
    this.showLeaseCalculatedData = false;
  }

  setFirstStartDate(event) {
    const presentTransactions = this.activeLease.transactions;
    this.activeLease.transactions = [];

    let targetYear = +event.target.value;

    for (; targetYear <= this.pendingYears[0]; targetYear++) {
      var existingTransaction = presentTransactions.find(
        (x) => targetYear == this.getYearFromDate(x.startDate),
      );

      if (existingTransaction) {
        this.activeLease.transactions.push({
          ...existingTransaction,
          startDate: `${targetYear}-07-01`,
        });
      } else {
        this.activeLease.transactions.push({
          ...presentTransactions[0],
          startDate: `${targetYear}-07-01`,
        });
      }
    }
  }

  navigateToCalculator() {
    this.router.navigate(['/calculator']);
  }

  addNewTransaction() {
    this.isNewTransaction = true;
    this.isHistoryOpen = false;

    const lastTrans = this.activeLease.closedTrans[0];
    let lastYear = this.getYearFromDate(lastTrans.startDate);

    this.activeLease.transactions = [];

    if (lastYear >= this.pendingYears[0]) {
      this.activeLease.transactions.push({
        amountPerAcre: lastTrans.amountPerAcre,
        interest: lastTrans.interestRate,
        startDate: `${this.pendingYears[0]}-07-01`,
      });
    }

    while (lastYear < this.pendingYears[0]) {
      lastYear++;
      this.activeLease.transactions.push({
        amountPerAcre: lastTrans.amountPerAcre,
        interest: lastTrans.interestRate,
        startDate: `${lastYear}-07-01`,
      });
    }

    this.activeLease.endDate = this.today;
    this.resetTextareaHeight();
  }

  cancelTransaction() {
    this.isNewTransaction = false;
    this.isHistoryOpen = true;
    this.showLeaseCalculatedData = false;
  }

  initNewLease() {
    this.isNewTransaction = true;
    this.isHistoryOpen = false;
    this.activeLease = this.createLeaseClient();
  }

  async deleteActiveLease(index?: number) {
    const alert = await this.alertController.create({
      header: 'Delete Lease?',
      message: 'Are you sure you want to delete this lease?',
      cssClass: 'alertStyle',
      buttons: [
        {
          text: 'Delete',
          cssClass: 'bg-danger',
          handler: () => {
            index =
              index ??
              this.leaseClients.findIndex((x) => x.id == this.activeLease.id);
            this.leaseClients.splice(index, 1);
            this.leaseService.deleteLeaseClient(this.activeLease.id);

            this.activeLease = null;
            this.showLeaseCalculatedData = false;
            this.isNewTransaction = false;
            this.isHistoryOpen = false;

            this.commonService.presentToast(
              'Lease deleted successfully',
              'successToastClass',
              'trash-outline',
            );
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

  calculateLease(formRef) {
    if (!formRef.valid) return;

    formRef.form.markAsPristine();

    this.activeLease.name = formRef.value.name || 'Unknown';
    this.activeLease.acres = formRef.value.acres;
    this.activeLease.endDate = formRef.value.endDate;
    this.activeLease.notes = formRef.value.notes;
    this.activeLease.lastPaidYear = formRef.value.lastPaidYear;

    this.calculationResults = [];
    this.finalAmount = 0;

    this.activeLease.transactions.forEach((trxn) => {
      const principal = this.activeLease.acres * trxn.amountPerAcre;
      const timePeriod = this.calculationService.calculateTimePeriod(
        trxn.startDate.toString(),
        this.activeLease.endDate.toString(),
      );

      // Interest = (P * R * T_months) / 100
      const interest = (principal * trxn.interest * timePeriod.tm) / 100;
      const totalAmount = principal + interest;

      this.calculationResults.push({
        year: this.getYearFromDate(trxn.startDate),
        principal: principal,
        amountPerAcre: trxn.amountPerAcre,
        interestRate: trxn.interest,
        startDate: trxn.startDate,
        endDate: this.activeLease.endDate,
        timePeriod: timePeriod,
        interest: interest,
        totalAmount: totalAmount,
      });

      this.finalAmount += totalAmount;
    });

    this.showLeaseCalculatedData = true;
    this.commonService.presentToast(
      'Calculations completed successfully',
      'successToastClass',
      'calculator-outline',
    );
    // this.leaseClients.push(this.activeLease);
    // this.leaseService.saveLeaseClients(this.activeLease);
    // this.leaseClients = this.leaseService.getLeaseClients();
  }

  getYearFromDate(date) {
    return new Date(date).getFullYear();
  }

  removeTransactionInput(index: number) {
    this.activeLease.transactions.splice(index, 1);
  }

  addTransactionInput() {
    const lastTrans =
      this.activeLease.transactions[this.activeLease.transactions.length - 1] ||
      this.activeLease.closedTrans[0];
    const lastYear = this.getYearFromDate(
      lastTrans?.startDate || this.rawDate.toDateString(),
    );
    this.activeLease.transactions.push({
      amountPerAcre: lastTrans?.amountPerAcre || 0,
      interest: lastTrans?.interest || 1.5,
      startDate: `${lastYear + 1}-07-01`,
    });
  }

  determineLastPaidYear() {
    const trans = this.activeLease.closedTrans[0] || null;
    if (trans) {
      return this.getYearFromDate(trans.startDate).toString();
    } else {
      return (this.getYearFromDate(new Date()) - 1).toString();
    }
  }

  adjustTextareaHeight(event) {
    event.target.style.height = 0;
    event.target.style.height = `${event.target.scrollHeight}px`;
  }

  resetTextareaHeight() {
    setTimeout(() => {
      this.notesSection.nativeElement.style.height = `${this.notesSection.nativeElement.scrollHeight}px`;
    });
  }

  toggleHistoryVisibility() {
    this.isHistoryOpen = !this.isHistoryOpen;
  }

  createLeaseClient(): LeaseClient {
    const lastYear = Number(this.pendingYears[0]) || this.rawDate.getFullYear();

    return {
      id: Date.now(),
      acres: null as number,
      name: '',
      lastPaidYear: lastYear,
      transactions: [
        {
          amountPerAcre: null as number,
          interest: 1.5,
          startDate: `${lastYear}-07-01`,
        },
      ],
      endDate: this.today,
      closedTrans: [],
      notes: '',
    };
  }

  formatCurrency(value: number) {
    if (value === undefined || value === null) return '';
    const formattedValue = new Intl.NumberFormat('en-IN').format(
      Math.round(value * 100) / 100,
    );
    return `₹ ${formattedValue}`;
  }

  async shareResults() {
    const clipboardText = this.formatResultsForSharing();
    try {
      await Share.share({
        text: clipboardText,
      });
    } catch {
      const cb = navigator.clipboard;
      await cb.writeText(clipboardText);
      this.commonService.presentToast(
        'The data has been copied to the clipboard successfully.',
      );
    }
  }

  formatResultsForSharing() {
    const separator = `------------------------------`;
    const yearSep = (y) => `--------Year : ${y}--------`;
    const lines: string[] = [
      `Name: ${this.activeLease.name}`,
      `Acres: ${this.activeLease.acres}`,
    ];

    this.calculationResults.forEach((result, i) => {
      const { y, m, d, tm } = result.timePeriod;
      const principal = this.activeLease.acres * result.amountPerAcre;

      lines.push(
        yearSep(result.year),
        `Principal : ${result.amountPerAcre} * ${this.activeLease.acres} = ${this.formatCurrency(principal)}`,
        `Interest rate : ${result.interestRate}%`,
        ``,
        `Start date: ${this.formatDate(result.startDate)}`,
        `End date: ${this.formatDate(result.endDate)}`,
        `Duration : ${y}y ${m}m ${d}d`,
        `in months : ${tm.toFixed(2)}`,
        ``,
        `Interest: ${this.formatCurrency(result.interest)}`,
        `Total ${i + 1}: ${this.formatCurrency(result.totalAmount)}`,
      );
    });

    lines.push(
      `${separator}`,
      `Final amount: ${this.formatCurrency(this.finalAmount)}`,
    );

    const serverURL = `https://clida3.web.app/calculator`;

    lines.push(`${separator}`, serverURL);

    return lines.join('\n');
  }

  formatDate(date: string | Date): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  finalizePayment() {
    let calculation = null;

    if (
      this.activeLease.transactions.length !== this.calculationResults.length
    ) {
      this.commonService.presentToast(
        'Error: Calculation mismatch. Please recalculate.',
        'dangerToastClass',
      );
      return;
    }

    this.activeLease.transactions.forEach((trans) => {
      calculation = this.calculationResults.find(
        (x) =>
          x.startDate == trans.startDate &&
          x.amountPerAcre == trans.amountPerAcre &&
          x.interestRate == trans.interest,
      );

      this.activeLease.closedTrans.unshift({
        amountPerAcre: trans.amountPerAcre,
        interestRate: trans.interest,
        startDate: trans.startDate,
        endDate: this.activeLease.endDate,
        acres: this.activeLease.acres,
        timePeriod: calculation.timePeriod,
        principal: calculation.principal,
        interest: calculation.interest,
        totalAmount: calculation.totalAmount,
        year: calculation.year,
      });
    });

    this.activeLease.transactions = [];
    this.activeLease.lastPaidYear = this.activeLease.closedTrans[0].year;

    this.calculationResults = [];
    this.finalAmount = 0;
    this.showLeaseCalculatedData = false;
    this.isHistoryOpen = true;
    this.isNewTransaction = false;

    this.leaseService.saveLeaseClients(this.activeLease);
    this.leaseClients = this.leaseService.getLeaseClients();
    this.commonService.presentToast(
      'Payment saved successfully',
      'successToastClass',
      'checkmark-circle-outline',
    );
  }

  async deleteTransaction(index: number, slidingItem?: IonItemSliding) {
    if (slidingItem) {
      slidingItem.close();
    }
    const alert = await this.alertController.create({
      header: 'Delete Transaction?',
      message: 'Are you sure you want to delete this transaction?',
      cssClass: 'alertStyle',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Delete',
          cssClass: 'bg-danger',
          handler: () => {
            this.activeLease.closedTrans.splice(index, 1);
            this.leaseService.saveLeaseClients(this.activeLease);
            this.leaseClients = this.leaseService.getLeaseClients();
            this.commonService.presentToast(
              'Transaction deleted successfully',
              'successToastClass',
              'trash-outline',
            );
          },
        },
      ],
    });

    await alert.present();
  }
}
