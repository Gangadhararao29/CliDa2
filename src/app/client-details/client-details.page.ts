import { Component, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IonAccordionGroup } from '@ionic/angular';

import { CalculationService } from '../services/calculation.service';
import { CommonService } from '../services/common.service';
import { DataBaseService } from '../services/data-base.service';
import { Subscription } from 'rxjs';

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
  openedAccordion;
  isOldStyle = false;
  transactions = { active: 0, closed: 0 };
  pageRefreshSub: Subscription;

  constructor(
    private activatedRoute: ActivatedRoute,
    private dataBaseService: DataBaseService,
    private commonService: CommonService,
    private calculationService: CalculationService
  ) {}

  ionViewWillEnter() {
    this.selectedChips = [];
    this.hideSkeletonText = false;
    this.theme = this.commonService.getTheme();
    this.clientId = this.activatedRoute.snapshot.params.key;
    this.isOldStyle = localStorage.getItem('isOldStyle') === 'true';
    this.dataBaseService.getClientByKey(this.clientId).then((res) => {
      this.client = res;
      this.client.id = this.clientId;
      this.updateDependencies(this.client);
      this.hideSkeletonText = true;
    });

    this.pageRefreshSub = this.commonService.pageRefreshEmitter.subscribe(
      (newClient) => {
        if (newClient) this.updateDependencies(newClient);
      }
    );
  }

  trackData(index, record) {
    return record.id;
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

  getColor(detail) {
    const tm = this.calculationService.calculateTimePeriod(
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

    this.pageRefreshSub?.unsubscribe();
  }

  toggleClosedData() {
    this.showClosedData = !this.showClosedData;
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

  accordionGroupChange(event) {
    this.openedAccordion = event.detail.value;
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
    localStorage.setItem('isOldStyle', (!this.isOldStyle).toString());
    this.isOldStyle = !this.isOldStyle;
  }
}
