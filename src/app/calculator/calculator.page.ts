import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import sampleData from '../../assets/sampleData.json';

@Component({
  selector: 'app-calculator',
  templateUrl: './calculator.page.html',
  styleUrls: ['./calculator.page.scss'],
})
export class CalculatorPage implements OnInit {
  today = new Date()
    .toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
    .split('/')
    .reverse()
    .join('-');
  title = 'Calculator';
  clientName = '';
  clientID = 0;
  clientsData = [];
  linkData = {} as any;
  client: any;
  timePeriod: { d: number; m: number; y: number };
  timePeriodInMonths: number;
  interestObj: {
    interest: number;
    newPrincipal?: number;
    newInterest?: number;
    tm?: number;
  };
  advIntShow = false;
  showCalculatedData = false;
  calcSubscribtion: any;

  constructor(private activatedRoute: ActivatedRoute) {}

  ngOnInit() {
    this.activatedRoute.params.subscribe((params) => {
      this.clientName = params.name;
      this.clientID = params.id;
      if (this.clientID) {
        this.clientsData = sampleData;
        this.clientsData.forEach((ele) => {
          if (ele.name === this.clientName) {
            this.linkData = ele.data.find((record) => record.id == this.clientID);
          }
        });
      }
      // this.clientID = params.id;
    });
  }
}
