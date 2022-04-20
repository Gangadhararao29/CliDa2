import { Component } from '@angular/core';
import { ClientDataService } from '../services/client-data.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
})
export class DashboardPage {
  clientsData = [];
  totalArray = [];
  name: any;
  key: any;
  principal: any;
  interestObj: any;
  timeperiod: any;
  total: number;
  isd = Intl.NumberFormat('en-IN');
  array1: any[];
  today = new Date()
    .toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'numeric',
      year: 'numeric',
    })
    .split('/')
    .reverse()
    .join('-');
  time: { d: number; m: number; y: number };
  array2: any[];
  math;
  totalClients: Array<any>;
  graphDataObservable: any;
  timeGridIcon = 'arrow-down-outline';
  principalGridIcon = 'arrow-down-outline';
  constructor(private clientDataService: ClientDataService) {
    this.math = Math;
  }

  ionViewWillEnter() {
    this.timeGridIcon = 'arrow-down-outline';
    this.principalGridIcon = 'arrow-down-outline';
    this.clientDataService.getAllClientsData().then((res) => {
      this.totalClients = res;
      this.totalArray = [];
      this.getTotalArray(res);
      this.sortByPrincipal();
      this.sortByTimePeriod();
    });
  }

  getTotalArray(response) {
    response.forEach((client) => {
      this.name = client.data.name;
      this.key = client.key;
      let totalPrincipal = 0;
      let greaterTimePeriod = 0;
      let totalInterest = 0;
      client.data.data.forEach((record) => {
        if (!record.closedOn) {
          this.principal = record.principal;
          this.time = this.calculateTimeperiod(record.startDate, this.today);
          this.interestObj = this.calculateInterest(
            this.principal,
            this.time,
            record.interest
          );
          this.timeperiod = this.time.m + 12 * this.time.y + this.time.d / 30.0;
          this.total = this.principal + this.interestObj.interest;
          totalPrincipal += this.principal;
          totalInterest += this.interestObj.interest;
          if (this.timeperiod > greaterTimePeriod) {
            greaterTimePeriod = this.timeperiod;
          }
        }
      });
      this.totalArray.push({
        key: this.key,
        name: this.name,
        totalPrincipal,
        totalInterest,
        greaterTimePeriod,
        finalAmount: totalPrincipal + totalInterest,
      });
    });
  }

  sortByPrincipal(value = true) {
    this.array1 = Array.from(
      this.totalArray.sort((a, b) => {
        const keyA = a.totalPrincipal;
        const keyB = b.totalPrincipal;
        if (keyA < keyB) {
          return value ? +1 : -1;
        }
        if (keyA > keyB) {
          return value ? -1 : +1;
        }
      })
    );
  }

  sortByTimePeriod(value = true) {
    this.array2 = Array.from(
      this.totalArray.sort((a, b) => {
        const keyA = a.greaterTimePeriod;
        const keyB = b.greaterTimePeriod;
        if (keyA < keyB) {
          return value ? +1 : -1;
        }
        if (keyA > keyB) {
          return value ? -1 : +1;
        }
      })
    );
  }

  getTotalPrincipalAmount() {
    let sum = 0;
    this.totalArray.forEach((ele) => {
      sum += ele.totalPrincipal;
    });
    return sum;
  }

  getFinalAmount() {
    let sum = 0;
    this.totalArray.forEach((ele) => {
      sum += ele.finalAmount;
    });
    return sum;
  }

  calculateTimeperiod(startDate, endDate) {
    const d1 = new Date(startDate).getDate();
    const m1 = new Date(startDate).getMonth() + 1;
    const y1 = new Date(startDate).getFullYear();
    let d2 = new Date(endDate).getDate();
    let m2 = new Date(endDate).getMonth() + 1;
    let y2 = new Date(endDate).getFullYear();

    if (y2 >= y1) {
      if (d1 > d2) {
        d2 += 30;
        m2--;
      }

      if (m1 > m2) {
        m2 += 12;
        y2--;
      }
    }
    if (y1 > y2) {
      return { d: NaN, m: NaN, y: NaN };
    } else {
      return {
        d: d2 - d1,
        m: m2 - m1,
        y: y2 - y1,
      };
    }
  }

  calculateInterest(principal, time, rate) {
    let tm = time.m + 12 * time.y + time.d / 30.0;
    if (tm <= 36) {
      const interest = (principal * tm * rate) / 100.0;
      return { interest };
    } else {
      const interest = (principal * 36 * rate) / 100.0;
      tm = tm - 36;
      const newPrincipal = principal + interest;
      const newInterest = (newPrincipal * tm * rate) / 100.0;
      return { interest, newPrincipal, newInterest, tm };
    }
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
}
