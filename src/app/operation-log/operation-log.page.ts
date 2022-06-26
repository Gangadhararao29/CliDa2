import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-operation-log',
  templateUrl: './operation-log.page.html',
  styleUrls: ['./operation-log.page.scss'],
})
export class OperationLogPage {
  logData = [];
  constructor() {}

  ionViewWillEnter() {
    this.logData = localStorage.getItem('logs')
      ? JSON.parse(localStorage.getItem('logs')).reverse()
      : [];
  }

  getColor(operation) {
    switch (operation) {
      case 'new':
        return 'success';
      case 'edit':
        return 'primary';
      case 'delete':
        return 'danger';
    }
  }
}
