import { Component, OnInit } from '@angular/core';
import sampleData from '../../assets/sampleData.json';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
})
export class DashboardPage implements OnInit {
  clientsData = [];
  totalArray = [];
  name: any;
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
  graphObject: any;
  math;
  constructor() {
    this.math = Math;
  }

  ngOnInit() {
    this.clientsData = sampleData;
    this.getTotalArray();
    this.sortByPrincipal();
    this.sortByTimePeriod();
    this.sortByYear();
  }

  getTotalArray() {
    this.clientsData.forEach((client) => {
      this.name = client.name;
      let totalPrincipal = 0;
      let greaterTimePeriod = 0;
      let totalInterest = 0;
      client.data.forEach((record) => {
        // console.log(record);
        this.principal = record.principal;
        this.time = this.calculateTimeperiod(record.startDate, this.today);
        this.interestObj = this.calcaulateInterest(
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
      });
      this.totalArray.push({
        name: this.name,
        totalPrincipal,
        totalInterest,
        greaterTimePeriod,
        finalAmount: totalPrincipal + totalInterest,
      });
    });
    // console.log(this.totalArray);
  }

  sortByPrincipal() {
    this.array1 = Array.from(
      this.totalArray.sort((a, b) => {
        const keyA = a.totalPrincipal;
        const keyB = b.totalPrincipal;
        if (keyA < keyB) {
          return +1;
        }
        if (keyA > keyB) {
          return -1;
        }
      })
    );
    // console.log(this.array1);
  }

  sortByTimePeriod() {
    this.array2 = Array.from(
      this.totalArray.sort((a, b) => {
        const keyA = a.greaterTimePeriod;
        const keyB = b.greaterTimePeriod;
        if (keyA < keyB) {
          return +1;
        }
        if (keyA > keyB) {
          return -1;
        }
      })
    );
    // console.log(this.array2);
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

  calcaulateInterest(principal, time, rate) {
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

  sortByYear() {
    const combinedData = [];
    const dateSet = new Set();
    this.clientsData.forEach((record) => {
      record.data.forEach((data) => {
        combinedData.push(data);
        dateSet.add(new Date(data.startDate).getFullYear());
      });
    });

    const filteredDataForYear = {};
    dateSet.forEach((date) => {
      filteredDataForYear[`${date}`] = combinedData.filter(
        (objectData) => new Date(objectData.startDate).getFullYear() == date
      );
    });

    const filteredDataByMonth = {};
    for (const year in filteredDataForYear) {
      if (year) {
        const monthArray = (filteredDataByMonth[year] = [[], []]);
        filteredDataForYear[year].filter((element) => {
          if (new Date(element.startDate).getMonth() + 1 < 6) {
            monthArray[0].push(element);
          } else {
            monthArray[1].push(element);
          }
        });
      }
    }

    const graphObject = {};
    for (const halfYearlyData in filteredDataByMonth) {
      if (halfYearlyData) {
        graphObject[halfYearlyData] = { prin1: 0, tot1: 0, prin2: 0, tot2: 0 };
        filteredDataByMonth[halfYearlyData][0].forEach((record) => {
          graphObject[halfYearlyData].prin1 += record.principal;
          graphObject[halfYearlyData].tot1 +=
            (record.principal * record.interest) / 100.0;
        });

        filteredDataByMonth[halfYearlyData][1].forEach((record) => {
          graphObject[halfYearlyData].prin2 += record.principal;
          graphObject[halfYearlyData].tot2 +=
            (record.principal * record.interest) / 100.0;
        });
      }
    }
    this.graphObject = graphObject;
  }
}
