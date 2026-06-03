import { Component, ElementRef, ViewChild } from '@angular/core';
import { DataBaseService } from '../services/data-base.service';
import { CalculationService } from '../services/calculation.service';
import { UtilsService } from '../services/utils.service';
import { localStorConsts, LocalStorageUtils } from '../shared/local-storage';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: false,
})
export class DashboardPage {
  recTransPage = 1;
  upTransPage = 1;
  cliSumPage = 1;
  topEarPage = 1;
  totalArray = [];
  isd = Intl.NumberFormat('en-IN');
  array1: any[];
  array2: any[];
  math;
  totalClients: Array<any>;
  topEarners: any[] = [];
  timeGridIcon = 'arrow-down-outline';
  principalGridIcon = 'arrow-down-outline';
  topEarGridIcon = 'arrow-down-outline';
  hideSkeletonText = false;
  @ViewChild('scrollableContainer', { static: true })
  scrollableContainer!: ElementRef;
  @ViewChild('toggleDashSection', { static: true })
  toggleDashSection;
  @ViewChild('chart1', { static: true }) chart1!: ElementRef;
  @ViewChild('chart2', { static: true }) chart2!: ElementRef;
  @ViewChild('chart3', { static: true }) chart3!: ElementRef;
  @ViewChild('chart4', { static: true }) chart4!: ElementRef;

  visibleChartIndex = 0; // 0: Line, 1: Pie, 2: Top Clients, 3: Interest
  nextChartIcon = 'pie-chart-sharp'; // Default next is pie
  scrollTimeout: any;
  logData: any[];
  dashPref: any;
  defaultPref = {
    stats: true,
    graphs: true,
    recTrans: true,
    upTrans: true,
    cliSum: true,
    topEar: true,
  };

  constructor(
    private dataBaseService: DataBaseService,
    private calculationService: CalculationService,
    private utilsService: UtilsService
  ) {
    this.math = Math;
  }

  ionViewWillEnter() {
    this.hideSkeletonText = false;
    this.logData = this.utilsService.formatLogDataForUI();
    this.dashPref = LocalStorageUtils.getItem(localStorConsts.dashPref) || Object.assign({}, this.defaultPref);
  }

  ionViewDidEnter() {
    this.dataBaseService.getAllClientsDataWithKeys().then((res) => {
      this.totalClients = this.filterOpenData(res);
      this.totalArray = [];
      this.getTotalArray(this.totalClients);
      this.sortByPrincipal(this.principalGridIcon === 'arrow-down-outline');
      this.sortByTimePeriod(this.timeGridIcon === 'arrow-down-outline');
      this.sortByTopEarnings(this.topEarGridIcon === 'arrow-down-outline');
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
    this.totalArray = response.map((client) => {
      const name = client.data.name;
      const key = client.key;
      let totalPrincipal = 0;
      let greaterTimePeriod = 0;
      let totalInterest = 0;
      let totalEarnings = 0;

      client.data.data.forEach((record) => {
        const timeObject = this.calculationService.calculateTimePeriod(
          record.startDate
        );
        const intArr = this.calculationService.calculateTotalInterest({
          principal: record.principal,
          rate: record.interest,
          startDate: record.startDate,
        });

        totalPrincipal += record.principal;
        totalInterest += intArr[0].intAmt;
        totalEarnings += (record.principal * record.interest) / 100;

        if (timeObject.tm > greaterTimePeriod) {
          greaterTimePeriod = timeObject.tm;
        }
      });

      return {
        key,
        name,
        totalPrincipal,
        totalInterest,
        totalEarnings,
        greaterTimePeriod,
        finalAmount: totalPrincipal + totalInterest,
      };
    });
  }

  sortByPrincipal(value) {
    this.array1 = [...this.totalArray]
      .filter((rec) => rec.finalAmount !== 0)
      .sort((a, b) => {
        const keyA = a.totalPrincipal;
        const keyB = b.totalPrincipal;
        return value ? keyB - keyA : keyA - keyB;
      });
  }

  sortByTimePeriod(value) {
    this.array2 = [...this.totalArray].sort((a, b) => {
      const keyA = a.greaterTimePeriod;
      const keyB = b.greaterTimePeriod;
      return value ? keyB - keyA : keyA - keyB;
    });
  }

  sortByTopEarnings(value) {
    this.topEarners = [...this.totalArray]
      .filter((rec) => rec.finalAmount !== 0)
      .sort((a, b) => {
        const keyA = a.totalEarnings;
        const keyB = b.totalEarnings;
        return value ? keyB - keyA : keyA - keyB;
      });
  }

  getTotalPrincipalAmount() {
    return this.totalArray.reduce(
      (prev, curr) => prev + curr.totalPrincipal,
      0
    );
  }

  getEarnings() {
    return this.totalArray.reduce((prev, curr) => prev + curr.totalEarnings, 0);
  }

  getFinalAmount() {
    return Math.round(
      this.totalArray.reduce((prev, curr) => prev + curr.finalAmount, 0)
    );
  }

  getClientsDetailsPageUrl(key) {
    return 'client-details/' + key;
  }

  sortTopEarGridChange() {
    if (this.topEarGridIcon === 'arrow-down-outline') {
      this.topEarGridIcon = 'arrow-up-outline';
      this.sortByTopEarnings(false);
    } else {
      this.topEarGridIcon = 'arrow-down-outline';
      this.sortByTopEarnings(true);
    }
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

  toggleDashPref(prop) {
    this.dashPref[prop] = !this.dashPref[prop];
    setTimeout(() => {
      this.toggleDashSection.el.scrollIntoView({
        inline: 'center',
        block: 'center',
      });
    });
    LocalStorageUtils.setItem(localStorConsts.dashPref, this.dashPref);
  }

  toggleChart() {
    this.visibleChartIndex = (this.visibleChartIndex + 1) % 4;
    this.scrollToChart(this.visibleChartIndex);
    this.updateIcon();
  }

  segmentChanged(index: number) {
    this.visibleChartIndex = index;
    this.scrollToChart(index);
    this.updateIcon();
  }

  scrollToChart(index: number) {
    let el: ElementRef;
    switch (index) {
      case 0:
        el = this.chart1;
        break;
      case 1:
        el = this.chart2;
        break;
      case 2:
        el = this.chart3;
        break;
      case 3:
        el = this.chart4;
        break;
      default:
        el = this.chart1;
    }

    if (el && el.nativeElement) {
      el.nativeElement.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'center',
      });
    }
  }

  updateIcon() {
    // Logic: Button shows "Next" chart icon
    // If 0 (Line) -> Next is Pie (1) -> 'pie-chart-sharp'
    // If 1 (Pie) -> Next is Top (2) -> 'bar-chart-sharp'
    // If 2 (Top) -> Next is Interest (3) -> 'podium-sharp' // or 'stats-chart-sharp' depending on preference
    // If 3 (Interest) -> Next is Line (0) -> 'stats-chart-sharp' // Line icon

    const nextIndex = (this.visibleChartIndex + 1) % 4;
    switch (nextIndex) {
      case 0:
        this.nextChartIcon = 'stats-chart-sharp';
        break;
      case 1:
        this.nextChartIcon = 'pie-chart-sharp';
        break;
      case 2:
        this.nextChartIcon = 'bar-chart-sharp';
        break;
      case 3:
        this.nextChartIcon = 'cellular-sharp';
        break; // cellular looks like histogram/signal
    }
  }

  onScroll() {
    clearTimeout(this.scrollTimeout);
    this.scrollTimeout = setTimeout(() => {
      if (!this.scrollableContainer) return;
      const container = this.scrollableContainer.nativeElement;
      // const scrollCenter = container.scrollLeft + (container.offsetWidth / 2);

      const charts = [this.chart1, this.chart2, this.chart3, this.chart4];
      let closestIndex = this.visibleChartIndex;
      let minDistance = Number.MAX_VALUE;

      const containerRect = container.getBoundingClientRect();
      const containerCenter = containerRect.left + containerRect.width / 2;

      charts.forEach((chart, index) => {
        if (!chart || !chart.nativeElement) return;
        const rect = chart.nativeElement.getBoundingClientRect();
        const chartCenter = rect.left + rect.width / 2;

        const dist = Math.abs(chartCenter - containerCenter);
        if (dist < minDistance) {
          minDistance = dist;
          closestIndex = index;
        }
      });

      if (this.visibleChartIndex !== closestIndex) {
        this.visibleChartIndex = closestIndex;
        this.updateIcon();
      }
    }, 100); // Reduced timeout for better responsiveness
  }
}
