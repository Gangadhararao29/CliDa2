import { Component, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IonAccordionGroup } from '@ionic/angular';

import { CalculationService } from '../services/calculation.service';
import { CommonService } from '../services/common.service';
import { DataBaseService } from '../services/data-base.service';
import { ShareContentService } from '../services/share-content.service';
import { Subscription } from 'rxjs';
import { localStorConsts, LocalStorageUtils } from '../shared/local-storage';

@Component({
  selector: 'app-client-details',
  templateUrl: './client-details.page.html',
  styleUrls: ['./client-details.page.scss'],
  standalone: false,
})
export class ClientDetailsPage {
  @ViewChild(IonAccordionGroup, { static: true })
  accordionGroup: IonAccordionGroup;
  @ViewChildren('modal') modals: QueryList<any>;
  client: { id: string; name: string; data: any[] };
  clientId: any;
  today: string;
  isd = Intl.NumberFormat('en-IN');
  showClosedData = false;
  hideSkeletonText: boolean;
  totalAmount = 0;
  theme: string;
  selectedChips = [];
  openedAccordion;
  isOldStyle = false;
  transactions = { active: 0, closed: 0 };
  pageRefreshSub: Subscription;

  constructor(
    private activatedRoute: ActivatedRoute,
    private dataBaseService: DataBaseService,
    private commonService: CommonService,
    private calculationService: CalculationService,
    private shareContentService: ShareContentService,
  ) {}

  ionViewWillEnter() {
    this.today = this.commonService.today;
    this.selectedChips = [];
    this.hideSkeletonText = false;
    this.theme = this.commonService.getTheme();
    this.clientId = this.activatedRoute.snapshot.params.key;
    this.isOldStyle =
      LocalStorageUtils.getStringItem(localStorConsts.isOldStyle) === 'true';
    this.dataBaseService.getClientByKey(this.clientId).then((res) => {
      this.client = res || { name: 'Data not found', data: [] };
      this.client.id = this.clientId;
      this.updateDependencies(this.client);
      this.hideSkeletonText = true;
    });

    this.pageRefreshSub = this.commonService.pageRefreshEmitter.subscribe(
      (newClient) => {
        if (newClient) this.updateDependencies(newClient);
      },
    );
  }

  updateDependencies(res) {
    this.transactions = { active: 0, closed: 0 };
    this.totalAmount = 0;
    res.data.forEach((detail) => {
      if (detail.closedOn) {
        this.transactions.closed += 1;
      } else {
        this.totalAmount += detail.principal;
        this.transactions.active += 1;
      }
    });
  }

  calculateInterest(data) {
    const intArr = this.calculationService.calculateTotalInterest(
      {
        principal: data.principal,
        rate: data.interest,
        startDate: data.startDate,
      },
      data.closedOn || this.today,
    );
    return Math.round(intArr[0].intAmt * 100) / 100;
  }

  getColor(detail) {
    const { tm } = this.calculationService.calculateTimePeriod(
      detail?.startDate,
    );

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

    this.pageRefreshSub?.unsubscribe();
  }

  toggleClosedData() {
    this.showClosedData = !this.showClosedData;
  }

  onChipClick(data) {
    const isChipSelectedIndex = this.selectedChips.findIndex(
      (chip) => chip.id === data.id,
    );

    if (isChipSelectedIndex !== -1) {
      this.selectedChips.splice(isChipSelectedIndex, 1);
    } else {
      const calculatedObj = {
        id: data.id,
        principal: data.principal,
        interest: this.calculateInterest(data),
      };
      this.selectedChips.push(calculatedObj);
    }
  }

  accordionCleanUp() {
    this.accordionGroup.value = undefined;
    this.openedAccordion = undefined;
  }

  toggleTotalChips() {
    const totalRows = this.client.data.filter((record) => !record.closedOn);
    if (totalRows.length !== this.selectedChips.length) {
      this.selectedChips = [];
      totalRows.forEach((rec) => this.onChipClick(rec));
    } else {
      this.selectedChips = [];
    }
  }

  isChipSelected(id) {
    return this.selectedChips.find((chip) => chip.id == id) ? true : false;
  }

  onCheckBoxClick(event, data) {
    event.stopPropagation();
    this.onChipClick(data);
  }

  accordionGroupChange(event: CustomEvent) {
    const value = Number(event.detail?.value);
    this.openedAccordion = Number.isFinite(value) ? value : undefined;
  }

  selectRecord(id) {
    if (id !== this.openedAccordion) {
      this.openedAccordion = id;
      this.accordionGroup.value = id;
    } else {
      this.openedAccordion = undefined;
      this.accordionGroup.value = undefined;
    }
  }

  toggleLayout() {
    this.isOldStyle = !this.isOldStyle;
    LocalStorageUtils.setStringItem(
      localStorConsts.isOldStyle,
      this.isOldStyle.toString(),
    );
  }

  // async bulkApprove() {
  //   if (this.selectedChips.length === 0) return;

  //   const alert = await this.alertController.create({
  //     header: 'Bulk Approve',
  //     message: `Are you sure you want to approve/close ${this.selectedChips.length} selected transactions?`,
  //     cssClass: 'alertStyle',
  //     buttons: [
  //       {
  //         text: 'Approve All',
  //         cssClass: 'bg-success',
  //         handler: () => this.bulkApproveHandler(),
  //       },
  //       {
  //         text: 'Cancel',
  //         role: 'cancel',
  //       },
  //     ],
  //   });
  //   await alert.present();
  // }

  // async bulkDelete() {
  //   if (this.selectedChips.length === 0) return;

  //   const alert = await this.alertController.create({
  //     header: 'Bulk Delete',
  //     message: `Are you sure you want to PERMANENTLY delete ${this.selectedChips.length} selected transactions?`,
  //     cssClass: 'alertStyle',
  //     buttons: [
  //       {
  //         text: 'Delete All',
  //         cssClass: 'bg-danger',
  //         handler: () => this.bulkDeleteHandler(),
  //       },
  //       {
  //         text: 'Cancel',
  //         role: 'cancel',
  //       },
  //     ],
  //   });
  //   await alert.present();
  // }

  bulkApproveHandler() {
    this.commonService.presentLoading('Approving...');

    this.selectedChips.forEach((chip) => {
      const record = this.client.data.find((r) => r.id === chip.id);
      const displayDate = this.today.split('-').reverse().join('/');
      if (record && !record.closedOn) {
        record.closedOn = this.today;
        record.closedAmount = record.principal + chip.interest;
        record.bulkApproved = true;
        record.comments = record.comments
          ? record.comments + `\nClosed via bulk approve on ${displayDate}.`
          : `Closed via bulk approve on ${displayDate}.`;
      }
    });

    this.dataBaseService
      .bulkUpdateClientByKey(this.client.id, this.client, 'approve')
      .then(() => {
        this.commonService.dismissLoading();
        this.selectedChips = [];
        this.updateDependencies(this.client);
        this.commonService.presentToast('Selected transactions approved');
      });
  }

  bulkDeleteHandler() {
    this.commonService.presentLoading('Deleting...');

    const selectedIds = this.selectedChips.map((c) => c.id);
    this.client.data.forEach((record) => {
      if (selectedIds.includes(record.id)) {
        record.bulkDeleted = true;
      }
    });

    this.dataBaseService
      .bulkUpdateClientByKey(this.client.id, this.client, 'delete')
      .then(() => {
        this.commonService.dismissLoading();
        this.client.data = this.client.data.filter((record) => !record.deleted);
        this.selectedChips = [];
        this.updateDependencies(this.client);
        this.commonService.presentToast(
          'Selected transactions have been deleted successfully.',
        );
      });
  }

  currencyFormatter(value) {
    return this.commonService.formatCurrency(value);
  }

  bulkShareHandler() {
    const selectedIds = this.selectedChips.map((c) => c.id);
    const selectedRecords = this.client.data.filter((record) =>
      selectedIds.includes(record.id),
    );

    const outputLines = [];

    selectedRecords.forEach((rec) => this.insertLines(rec, outputLines));

    const separator = `------------------------------`;

    const totalPrincipal = this.selectedChips.reduce(
      (a, b) => a + b.principal,
      0,
    );
    const totalInterest = this.selectedChips.reduce(
      (a, b) => a + b.interest,
      0,
    );

    if (this.selectedChips.length > 1) {
      // outputLines.push(
      //   separator,
      //   `Final Principal : ${this.currencyFormatter(totalPrincipal || 0)}`,
      //   `Final Interest : ${this.currencyFormatter(totalInterest || 0)}`,
      //   separator,
      //   `Final Amount : ${this.currencyFormatter(totalPrincipal + totalInterest || 0)}`,
      //   separator,
      // );

      outputLines.push(
        'Final Summary',
        separator,
        `Principal : ${this.currencyFormatter(totalPrincipal || 0)}`,
        `Interest : ${this.currencyFormatter(totalInterest || 0)}`,
        separator,
        `Grand Total : ${this.currencyFormatter(totalPrincipal + totalInterest || 0)}`,
        separator,
      );
    }

    this.shareContentService.shareText(outputLines.join('\n'));
  }

  insertLines(rec, outputLines) {
    const { principal, interest, startDate } = rec;
    const endDate = rec.closedOn || this.today;

    const { y, m, d, tm } = this.calculationService.calculateTimePeriod(
      startDate,
      endDate,
    );

    const intArray = this.calculationService.calculateTotalInterest(
      {
        principal: principal,
        rate: interest,
        startDate: startDate,
      },
      endDate,
    );

    const finalInterest = intArray.reduce(
      (prev, curr) => prev + curr.intAmt,
      0,
    );

    const separator = `------------------------------`;

    outputLines.push(
      `Principal : ${this.currencyFormatter(principal)}`,
      `Interest rate : ${interest}`,
      `End date : ${endDate}`,
      `Start date : ${startDate}`,
      `${separator}`,
      `Time period : ${y}y ${m}m ${d}d`,
      // `${separator}`,
      `Time in months : ${tm.toFixed(2)}`,
    );

    if (intArray.length === 1) {
      const interestAmt = intArray[0].intAmt;

      outputLines.push(
        `Total interest : ${this.currencyFormatter(interestAmt)}`,
        `${separator}`,
        `Total amount : ${this.currencyFormatter(interestAmt + principal)}`,
      );
    } else {
      outputLines.push('Interest breakdown');
      intArray.forEach(({ start, end, intAmt }) => {
        outputLines.push(
          `${start}y - ${(+end).toFixed(2)}y : ${this.currencyFormatter(intAmt)}`,
        );
      });

      outputLines.push(
        `Total interest : ${this.currencyFormatter(finalInterest)}`,
        `${separator}`,
        `Total amount : ${this.currencyFormatter(finalInterest + principal)}`,
      );
    }

    const jsonString = `${principal}|${interest}|${startDate}|${endDate}`;
    const encoded = encodeURIComponent(btoa(jsonString));

    const serverURL = `https://clida3.web.app/calculator/${encoded}`;
    const localURL = `http://localhost:4200/calculator/${encoded}`;

    outputLines.push(`${separator}`, serverURL, '\n');
  }
}
