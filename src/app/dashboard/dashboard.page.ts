import { Component, ElementRef, ViewChild } from '@angular/core';
import { ClientDataService } from '../services/client-data.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
})
export class DashboardPage {
  grid1Page = 1;
  grid2Page = 1;
  totalArray = [];
  isd = Intl.NumberFormat('en-IN');
  array1: any[];
  array2: any[];
  math;
  totalClients: Array<any>;
  timeGridIcon = 'arrow-down-outline';
  principalGridIcon = 'arrow-down-outline';
  hideSkeletonText = false;
  @ViewChild('scrollableContainer', { static: true })
  scrollableContainer!: ElementRef;
  @ViewChild('chart1', { static: true }) chart1!: ElementRef;
  @ViewChild('chart2', { static: true }) chart2!: ElementRef;
  isPieChartVisible = false;
  scrollTimeout: any;
  constructor(private clientDataService: ClientDataService) {
    this.math = Math;
  }

  ionViewDidEnter() {
    this.hideSkeletonText = false;
    this.clientDataService.getAllClientsDataWithKeys().then((res) => {
      this.totalClients = this.filterOpenData(res);
      this.totalArray = [];
      this.getTotalArray(this.totalClients);
      this.sortByPrincipal(this.principalGridIcon === 'arrow-down-outline');
      this.sortByTimePeriod(this.timeGridIcon === 'arrow-down-outline');
      this.hideSkeletonText = true;
    });
  }

  trackData(index, client) {
    return client.key;
  }

  filterOpenData(res) {
    return res.filter((ele) => {
      ele.data.data = ele.data.data.filter((record) => !record.closedOn);
      return ele.data.data.length;
    });
  }

  getTotalArray(response) {
    response.forEach((client) => {
      const name = client.data.name;
      const key = client.key;
      let totalPrincipal = 0;
      let greaterTimePeriod = 0;
      let totalInterest = 0;
      client.data.data.forEach((record) => {
        const timeObject = this.clientDataService.calculateTimeperiod(
          record.startDate
        );
        const intArr = this.clientDataService.calculateTotalInterest({
          principal: record.principal,
          rate: record.interest,
          startDate: record.startDate,
        });
        totalPrincipal += record.principal;
        totalInterest += intArr[0].intAmt;
        if (timeObject.tm > greaterTimePeriod) {
          greaterTimePeriod = timeObject.tm;
        }
      });

      this.totalArray.push({
        key,
        name,
        totalPrincipal,
        totalInterest,
        greaterTimePeriod,
        finalAmount: totalPrincipal + totalInterest,
      });
    });
  }

  sortByPrincipal(value) {
    this.array1 = [...this.totalArray]
      .filter((rec) => rec.finalAmount !== 0)
      .sort((a, b) => {
        const keyA = a.totalPrincipal;
        const keyB = b.totalPrincipal;
        if (keyA < keyB) {
          return value ? +1 : -1;
        }
        if (keyA > keyB) {
          return value ? -1 : +1;
        }
      });
  }

  sortByTimePeriod(value) {
    this.array2 = [...this.totalArray].sort((a, b) => {
      const keyA = a.greaterTimePeriod;
      const keyB = b.greaterTimePeriod;
      if (keyA < keyB) {
        return value ? +1 : -1;
      }
      if (keyA > keyB) {
        return value ? -1 : +1;
      }
    });
  }

  getTotalPrincipalAmount() {
    return this.totalArray.reduce(
      (prev, curr) => prev + curr.totalPrincipal,
      0
    );
  }

  getFinalAmount() {
    return Math.round(
      this.totalArray.reduce((prev, curr) => prev + curr.finalAmount, 0)
    );
  }

  getClientsDetailsPageUrl(key) {
    return 'client-details/' + key;
  }

  sortTimeGridChange() {
    if (this.timeGridIcon === 'arrow-down-outline') {
      this.timeGridIcon = 'arrow-up-outline';
      this.sortByTimePeriod(false);
    } else {
      this.timeGridIcon = 'arrow-down-outline';
      this.sortByTimePeriod(true);
    }
  }

  sortPrincipalGridChange() {
    if (this.principalGridIcon === 'arrow-down-outline') {
      this.principalGridIcon = 'arrow-up-outline';
      this.sortByPrincipal(false);
    } else {
      this.principalGridIcon = 'arrow-down-outline';
      this.sortByPrincipal(true);
    }
  }

  toggleChart() {
    const chart1Element = this.chart1.nativeElement;
    const chart2Element = this.chart2.nativeElement;

    if (this.isPieChartVisible) {
      chart1Element.scrollIntoView({ behavior: 'smooth', inline: 'start' });
      this.isPieChartVisible = false;
    } else {
      chart2Element.scrollIntoView({ behavior: 'smooth', inline: 'start' });
      this.isPieChartVisible = true;
    }
  }

  onScroll() {
    clearTimeout(this.scrollTimeout);
    this.scrollTimeout = setTimeout(() => {
      const container = this.scrollableContainer.nativeElement;
      const chart1Right =
        this.chart1.nativeElement.getBoundingClientRect().right;
      const chart2Left = this.chart2.nativeElement.getBoundingClientRect().left;
      if (container.scrollLeft >= chart2Left) {
        this.isPieChartVisible = true;
      } else if (container.scrollLeft <= chart1Right) {
        this.isPieChartVisible = false;
      }
    }, 250);
  }
}
