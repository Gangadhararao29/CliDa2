import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import sampleData from '../../assets/sampleData.json';

@Component({
  selector: 'app-clients-list',
  templateUrl: './clients-list.page.html',
  styleUrls: ['./clients-list.page.scss'],
})
export class ClientsListPage implements OnInit {
  clientsData: any;
  clientSearchValue = '';
  constructor(private router: Router, private activatedRoute: ActivatedRoute) {}

  ngOnInit() {
    this.clientsData = sampleData;
  }

  getRecordsInfo(data) {
    let closed = 0;
    data.forEach((record) => {
      if (record.closedOn) {
        closed++;
      }
    });
    return closed ? closed : null;
  }

  resetSearch() {
    this.clientSearchValue = null;
  }

  openClientDetails(name) {
    this.router.navigate(['clida/client-details', name]);
  }
}
