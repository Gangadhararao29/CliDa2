import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import sampleData from '../../../assets/sampleData.json';

@Component({
  selector: 'app-client-details',
  templateUrl: './client-details.page.html',
  styleUrls: ['./client-details.page.scss'],
})
export class ClientDetailsPage implements OnInit {
  client = {
    name: '',
    data: [],
  };
  name = '';
  title = 'Client details';
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
  showCloseDiv = false;
  showClosedData = false;
  id: any;
  clientDetailSubscribtion: any;
  constructor(private router: Router) {}

  ngOnInit() {
    this.client = sampleData[1];
  }

  dateDiff(date1, date2) {
    return { y: 2, m: 6, d: 25 };
  }

  totalTimeinMonths(date1, date2) {
    return 18.839;
  }

  calculateInterest(data) {
    return 12536.258;
  }

  openCalculator(id) {
    this.router.navigate(['clida', 'calculator',this.client.name,id]);
  }
}
