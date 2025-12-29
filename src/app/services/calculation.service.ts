import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class CalculationService {
  today = new Date()
    .toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
    .split('/')
    .reverse()
    .join('-');

  constructor() {}

  calculateTimePeriod(startDate, endDate = this.today) {
    const sd = new Date(startDate);
    const ed = new Date(endDate);
    const d1 = sd.getDate();
    const m1 = sd.getMonth() + 1;
    const y1 = sd.getFullYear();
    const d2 = ed.getDate();
    const m2 = ed.getMonth() + 1;
    const y2 = ed.getFullYear();

    let d = d2 - d1;
    let m = m2 - m1;
    let y = y2 - y1;

    if (d < 0) {
      d += 30;
      m -= 1;
    }
    if (m < 0) {
      m += 12;
      y -= 1;
    }
    if (y < 0) {
      return { d: NaN, m: NaN, y: NaN, tm: NaN };
    } else {
      return { d, m, y, tm: 12 * y + m + d / 30 };
    }
  }

  calculateTotalInterest(data, endDate = this.today, ci = 3) {
    let { tm } = this.calculateTimePeriod(data.startDate, endDate);
    let start = 0;
    const resultArray = [];
    while (tm > ci * 12) {
      tm -= ci * 12;
      const intAmt = data.principal * data.rate * 0.12 * ci;
      resultArray.push({
        start,
        end: start + ci,
        principal: data.principal,
        intAmt,
      });
      data.principal += intAmt;
      start += ci;
    }
    const remInt = (data.principal * data.rate * tm) / 100.0;
    resultArray.push({
      start,
      end: (start + tm / 12.0).toFixed(2),
      principal: data.principal,
      intAmt: remInt,
    });
    return resultArray;
  }
}
