import { Component, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
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
    private calculationService: CalculationService
  ) {}

  ionViewWillEnter() {
    this.theme = this.commonService.getTheme();
    this.today = this.commonService.today;
    this.populatePendingYears();
    this.leaseClients = this.leaseService.getLeaseClients();
    if (this.leaseClients.length > 0) {
      this.activeLease = this.leaseClients[0];
      this.isHistoryOpen = true;
    } else {
      this.activeLease = this.activeLease ?? this.generateNewClient();
      this.isHistoryOpen = false;
      this.isNewTransaction = true;
    }
    console.log(this.activeLease);
  }

  populatePendingYears() {
    let currentYear = this.rawDate.getFullYear();
    if (this.rawDate.getMonth() < 7) {
      currentYear--;
    }
    this.pendingYears = Array.from({ length: 5 }, (_, i) => currentYear - i);
  }

  changeActiveClient(client: LeaseClient) {
    const isSameClient = this.activeLease?.id == client.id;
    this.activeLease = isSameClient ? null : client;
    this.isNewTransaction = false;
    this.isHistoryOpen = !isSameClient;
    this.showLeaseCalculatedData = false;
  }

  routeToCalculator() {
    this.router.navigate(['/calculator']);
  }

  addNewTransaction() {
    this.isNewTransaction = true;
    this.isHistoryOpen = false;

    const lastTrans = this.activeLease.closedTrans[0];
    let lastYear = this.getOnlyYear(lastTrans.startDate);

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
    this.setCommentHeight();
  }

  cancelTransaction() {
    this.isNewTransaction = false;
    this.isHistoryOpen = true;
    this.showLeaseCalculatedData = false;
  }

  addNewLease() {
    this.isNewTransaction = true;
    this.isHistoryOpen = false;
    this.activeLease = this.generateNewClient();
  }

  deleteLease(index?: number) {
    index =
      index ?? this.leaseClients.findIndex((x) => x.id == this.activeLease.id);
    this.leaseClients.splice(index, 1);
    this.leaseService.deleteLeaseClient(this.activeLease.id);

    this.activeLease = null;
    this.showLeaseCalculatedData = false;
    this.isNewTransaction = false;
    this.isHistoryOpen = false;
  }

  saveLease() {
    this.leaseService.saveLeaseClients(this.leaseClients);
  }

  onLeaseSubmit(formRef) {
    if (!formRef.valid) return;

    formRef.form.markAsPristine();

    this.activeLease.name = formRef.value.name;
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
        this.activeLease.endDate.toString()
      );

      // Interest = (P * R * T_months) / 100
      const interest = (principal * trxn.interest * timePeriod.tm) / 100;
      const totalAmount = principal + interest;

      this.calculationResults.push({
        year: this.getOnlyYear(trxn.startDate),
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
    // this.leaseClients.push(this.activeLease);
    // this.leaseService.saveLeaseClients(this.activeLease);
    // this.leaseClients = this.leaseService.getLeaseClients();
  }

  getOnlyYear(date) {
    return new Date(date).getFullYear();
  }

  removeRecord(index: number) {
    this.activeLease.transactions.splice(index, 1);
  }

  addRecord() {
    const lastTrans =
      this.activeLease.transactions[this.activeLease.transactions.length - 1] ||
      this.activeLease.closedTrans[0];
    const lastYear = this.getOnlyYear(
      lastTrans?.startDate || this.rawDate.toDateString()
    );
    this.activeLease.transactions.push({
      amountPerAcre: lastTrans?.amountPerAcre || 0,
      interest: lastTrans?.interest || 1.5,
      startDate: `${lastYear + 1}-07-01`,
    });
  }

  getLastPaidYear() {
    const trans = this.activeLease.closedTrans[0] || null;
    if (trans) {
      return this.getOnlyYear(trans.startDate).toString();
    } else {
      return (this.getOnlyYear(new Date()) - 1).toString();
    }
  }

  getCommentHeight(event) {
    event.target.style.height = 0;
    event.target.style.height = `${event.target.scrollHeight}px`;
  }

  setCommentHeight() {
    setTimeout(() => {
      this.notesSection.nativeElement.style.height = `${this.notesSection.nativeElement.scrollHeight}px`;
    });
  }

  toggleHistory() {
    this.isHistoryOpen = !this.isHistoryOpen;
  }

  generateNewClient(): LeaseClient {
    const lastYear = Number(this.pendingYears[0]) || this.rawDate.getFullYear();

    return {
      id: Date.now(),
      acres: null as any,
      name: '',
      lastPaidYear: lastYear,
      transactions: [
        {
          amountPerAcre: null as any,
          interest: 1.5,
          startDate: `${lastYear}-07-01`,
        },
      ],
      endDate: this.today,
      closedTrans: [],
      notes: '',
    };
  }

  currencyFormat(value) {
    if (value === undefined || value === null) return '';
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

  generateResultHtml() {
    const separator = `-----------------------------`;
    const lines: string[] = [
      `Name: ${this.activeLease.name}`,
      `Acres: ${this.activeLease.acres}`,
      `${separator}`,
    ];

    this.calculationResults.forEach((result, i) => {
      const { y, m, d, tm } = result.timePeriod;
      lines.push(
        `--${result.year}---`,
        `Principal: ${result.amountPerAcre} * ${this.activeLease.acres}`,
        `Int rate: ${result.interestRate}`,
        `Start date: ${this.formatDate(result.startDate)}`,
        `End date: ${this.formatDate(result.endDate)}`,
        `Time taken: ${y}y ${m}m ${d}d`,
        `In months: ${tm.toFixed(2)}`,
        `Interest: ${this.currencyFormat(result.interest)}`,
        `Total ${i + 1}: ${this.currencyFormat(result.totalAmount)}`,
        `${separator}`
      );
    });

    lines.push(
      `Final amount: ${this.currencyFormat(this.finalAmount)}`,
      `${separator}`
    );

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

  addPayment() {
    let calculation = null;

    this.activeLease.transactions.forEach((trans) => {
      calculation = this.calculationResults.find(
        (x) =>
          x.startDate == trans.startDate &&
          x.amountPerAcre == trans.amountPerAcre &&
          x.interestRate == trans.interest
      );

      this.activeLease.closedTrans.unshift({
        amountPerAcre: trans.amountPerAcre,
        interestRate: trans.interest,
        startDate: trans.startDate,
        endDate: this.activeLease.endDate,
        tm: calculation.timePeriod.tm,
        principal: calculation.principal,
        interest: calculation.interest,
        totalAmount: calculation.totalAmount,
        year: this.getOnlyYear(trans.startDate),
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
  }
}
