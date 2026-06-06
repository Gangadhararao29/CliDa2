import { Component, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { CommonService } from '../services/common.service';
import { LeasesComponent } from '../shared/leases/leases.component';

@Component({
  selector: 'app-calculator2',
  templateUrl: './calculator2.page.html',
  styleUrls: ['./calculator2.page.scss'],
  standalone: false,
})
export class Calculator2Page {
  @ViewChild('leasesComponent') leasesComponent: LeasesComponent;
  theme: string;
  // activeLease: LeaseClient;

  constructor(
    private router: Router,
    private commonService: CommonService,
  ) {}

  ionViewWillEnter() {
    this.theme = this.commonService.getTheme();
  }

  navigateToCalculator() {
    this.router.navigate(['/calculator']);
  }

  // deleteActiveLease() {
  //   this.leasesComponent.deleteActiveLease();
  // }

  initNewLease() {
    this.leasesComponent.initNewLease();
  }
}
