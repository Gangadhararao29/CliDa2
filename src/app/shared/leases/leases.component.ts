import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { CommonService } from '../../services/common.service';
import { LeaseService } from '../../services/lease.service';
import {
  CalculationResult,
  ClosedTransaction,
  LeaseClient,
} from '../../calculator2/models/leaseClient.model';
import { AlertController, IonItemSliding } from '@ionic/angular';
import { CalculationService } from '../../services/calculation.service';
import { ShareContentService } from '../../services/share-content.service';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-leases',
  templateUrl: './leases.component.html',
  styleUrls: ['./leases.component.scss'],
  standalone: false,
})
export class LeasesComponent implements OnInit {
  @ViewChild('notesSection') notesSection: ElementRef;
  @ViewChild('formRef') formRef: NgForm;
  @Input() theme: string;
  @Input() openCalculator = false;

  today: string;
  rawDate = new Date();
  pendingYears: Array<number> = [];
  leaseClients: Array<LeaseClient> = [];
  activeLease: LeaseClient = null;
  isHistoryOpen = false;
  isNewTransaction = false;
  calculationResults: Array<CalculationResult> = [];
  finalAmount = 0;
  showLeaseCalculatedData = false;
  editingMode = false;
  editingIndex: number | null = null;

  constructor(
    private commonService: CommonService,
    private leaseService: LeaseService,
    private calculationService: CalculationService,
    private alertController: AlertController,
    private shareContentService: ShareContentService,
  ) {}

  ngOnInit() {
    this.today = this.commonService.today;
    this.initializeYearOptions();
    this.getLeaseClients();
  }

  initializeYearOptions() {
    let currentYear = this.rawDate.getFullYear();
    if (this.rawDate.getMonth() < 7) {
      currentYear--;
    }
    this.pendingYears = Array.from({ length: 5 }, (_, i) => currentYear - i);
  }

  getLeaseClients() {
    this.leaseService.getLeaseClients().then((leases) => {
      this.leaseClients = leases || [];
      if (this.leaseClients?.length > 0 && !this.openCalculator) {
        this.activeLease = this.activeLease ?? this.leaseClients[0];
        this.isHistoryOpen = true;
      } else {
        this.activeLease = this.activeLease ?? this.createLeaseClient();
        this.isHistoryOpen = false;
        this.isNewTransaction = true;
      }
    });
  }

  private resetCalculationState() {
    this.calculationResults = [];
    this.finalAmount = 0;
    this.showLeaseCalculatedData = false;
    this.editingMode = false;
  }

  private resetLeaseViewState() {
    this.isNewTransaction = false;
    this.isHistoryOpen = false;
    this.resetCalculationState();
  }

  initNewLease() {
    this.resetLeaseViewState();
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
          handler: () => this.deleteActiveLeaseHandler(index),
        },
        {
          text: 'Cancel',
          role: 'cancel',
        },
      ],
    });

    await alert.present();
  }

  deleteActiveLeaseHandler(index?: number) {
    index =
      index ?? this.leaseClients.findIndex((x) => x.id == this.activeLease.id);

    if (index >= 0) {
      this.leaseClients.splice(index, 1);
      this.leaseService.deleteLeaseClient(this.activeLease.id);
    }

    this.activeLease = null;
    this.showLeaseCalculatedData = false;
    this.isNewTransaction = false;
    this.isHistoryOpen = false;

    this.commonService.presentToast(
      'Lease deleted successfully',
      'successToastClass',
      'trash-outline',
    );
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

  setActiveLease(client: LeaseClient) {
    const isSameClient = this.activeLease?.id == client.id;
    this.activeLease = isSameClient ? null : client;
    this.isNewTransaction = false;
    this.isHistoryOpen = !isSameClient;
    this.showLeaseCalculatedData = false;
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

  cancelTransaction() {
    this.isNewTransaction = false;
    this.isHistoryOpen = !!this.activeLease?.closedTrans?.length;
    this.resetCalculationState();
  }

  currencyFormatter(value: number) {
    return this.commonService.formatCurrency(value);
  }

  removeTransactionInput(index: number) {
    this.activeLease.transactions.splice(index, 1);
  }

  determineLastPaidYear() {
    const trans = this.activeLease?.closedTrans?.[0] || null;
    if (trans) {
      return this.getYearFromDate(trans.startDate).toString();
    }
    return (this.getYearFromDate(new Date()) - 1).toString();
  }

  getYearFromDate(date) {
    return new Date(date).getFullYear();
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

  setFirstStartDate(event) {
    if (!this.activeLease) return;

    const presentTransactions = Array.isArray(this.activeLease.transactions)
      ? this.activeLease.transactions
      : [];
    this.activeLease.transactions = [];

    let targetYear = +event.target.value;
    const fallbackTransaction = presentTransactions[0] || {
      amountPerAcre: 0,
      interest: 1.5,
      startDate: `${targetYear}-07-01`,
    };

    for (; targetYear <= this.pendingYears[0]; targetYear++) {
      const existingTransaction = presentTransactions.find(
        (x) => targetYear == this.getYearFromDate(x.startDate),
      );

      if (existingTransaction) {
        this.activeLease.transactions.push({
          ...existingTransaction,
          startDate: `${targetYear}-07-01`,
        });
      } else {
        this.activeLease.transactions.push({
          ...fallbackTransaction,
          startDate: `${targetYear}-07-01`,
        });
      }
    }
  }

  addTransactionInput() {
    if (!this.activeLease) return;

    this.activeLease.transactions = this.activeLease.transactions || [];
    const lastTrans =
      this.activeLease.transactions[this.activeLease.transactions.length - 1] ||
      this.activeLease.closedTrans?.[0];
    const lastYear = this.getYearFromDate(
      lastTrans?.startDate || this.rawDate.toDateString(),
    );
    this.activeLease.transactions.push({
      amountPerAcre: lastTrans?.amountPerAcre || 0,
      interest: lastTrans?.interest || 1.5,
      startDate: `${lastYear + 1}-07-01`,
    });
  }

  async finalizePayment() {
    if (!this.activeLease) return;

    if (
      this.activeLease.transactions.length !== this.calculationResults.length
    ) {
      this.commonService.presentToast(
        'Error: Calculation mismatch. Please recalculate.',
        'dangerToastClass',
      );
      return;
    }

    if (this.editingMode) {
      this.activeLease.closedTrans = [];
    }

    this.activeLease.transactions.forEach((trans) => {
      const calculation = this.calculationResults.find(
        (x) =>
          x.startDate == trans.startDate &&
          x.amountPerAcre == trans.amountPerAcre &&
          x.interestRate == trans.interest,
      );

      if (!calculation) {
        this.commonService.presentToast(
          'Error: Missing calculated result for transaction.',
          'dangerToastClass',
        );
        return;
      }

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
    this.activeLease.lastPaidYear =
      this.activeLease.closedTrans[0]?.year ?? this.activeLease.lastPaidYear;

    this.resetCalculationState();
    this.isHistoryOpen = true;
    this.isNewTransaction = false;
    this.editingMode = false;

    await this.leaseService.saveLeaseClients(this.activeLease);
    this.leaseClients = await this.leaseService.getLeaseClients();
    this.commonService.presentToast(
      'Payment saved successfully',
      'successToastClass',
      'checkmark-circle-outline',
    );
  }

  async editTransaction(slidingItem: IonItemSliding) {
    if (slidingItem) {
      slidingItem.close();
    }

    this.editingMode = true;
    this.activeLease.transactions = this.activeLease.closedTrans.map((x) => {
      return {
        amountPerAcre: x.amountPerAcre,
        interest: x.interestRate,
        startDate: x.startDate,
      };
    });

    this.isHistoryOpen = false;
    this.showLeaseCalculatedData = false;
    this.isNewTransaction = true;
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
          handler: async () => {
            this.activeLease.closedTrans.splice(index, 1);
            await this.leaseService.saveLeaseClients(this.activeLease);
            this.leaseClients = await this.leaseService.getLeaseClients();
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

  async shareResults() {
    const clipboardText = this.formatResultsForSharing();
    await this.shareContentService.shareText(clipboardText);
  }

  yearSep = (y) => `--------Year : ${y}--------`;

  formatResultsForSharing() {
    const separator = `------------------------------`;
    const lines: string[] = [
      `Name: ${this.activeLease.name}`,
      `Acres: ${this.activeLease.acres}`,
      '',
    ];

    this.calculationResults.forEach((result, i) => {
      const { y, m, d, tm } = result.timePeriod;
      const principal = this.activeLease.acres * result.amountPerAcre;

      lines.push(
        this.yearSep(result.year),
        `Principal : ${result.amountPerAcre} * ${this.activeLease.acres} = ${this.currencyFormatter(principal)}`,
        `Interest rate : ${result.interestRate}%`,
        ``,
        `Start date: ${this.formatDate(result.startDate)}`,
        `End date: ${this.formatDate(result.endDate)}`,
        `Duration : ${y}y ${m}m ${d}d`,
        `in months : ${tm.toFixed(2)}`,
        ``,
        `Interest: ${this.currencyFormatter(result.interest)}`,
        `Total ${i + 1}: ${this.currencyFormatter(result.totalAmount)}`,
        '',
      );
    });

    lines.push(
      separator,
      `Final amount: ${this.currencyFormatter(this.finalAmount)}`,
      separator,
      `https://clida3.web.app/calculator2`,
    );

    return lines.join('\n');
  }

  async shareActiveLease(
    transaction: ClosedTransaction,
    slidingItem?: IonItemSliding,
  ) {
    const separator = `------------------------------`;
    const lines: string[] = [
      `Name: ${this.activeLease.name}`,
      `Acres: ${this.activeLease.acres}`,
      '',
    ];

    let result = transaction;
    const { y, m, d, tm } = result.timePeriod;
    const principal = result.acres * result.amountPerAcre;

    lines.push(
      this.yearSep(result.year),
      `Principal : ${result.amountPerAcre} * ${result.acres} = ${this.currencyFormatter(principal)}`,
      `Interest rate : ${result.interestRate}%`,
      ``,
      `Start date: ${this.formatDate(result.startDate)}`,
      `End date: ${this.formatDate(result.endDate)}`,
      `Duration : ${y}y ${m}m ${d}d`,
      `in months : ${tm.toFixed(2)}`,
      ``,
      `Interest: ${this.currencyFormatter(result.interest)}`,
      separator,
      `Final amount: ${this.currencyFormatter(result.totalAmount)}`,
      separator,
    );

    // console.log(lines.join('\n'));
    await this.shareContentService.shareText(lines.join('\n'));

    if (slidingItem) {
      slidingItem.close();
    }
  }

  formatDate(date: string | Date): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  addNewTransaction() {
    if (!this.activeLease) return;

    this.isNewTransaction = true;
    this.isHistoryOpen = false;

    const lastTrans = this.activeLease.closedTrans?.[0];
    this.activeLease.transactions = [];

    if (!lastTrans) {
      this.activeLease.transactions.push({
        amountPerAcre: 0,
        interest: 1.5,
        startDate: `${this.pendingYears[0]}-07-01`,
      });
      this.activeLease.endDate = this.today;
      this.resetTextareaHeight();
      return;
    }

    let lastYear = this.getYearFromDate(lastTrans.startDate);

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
}
