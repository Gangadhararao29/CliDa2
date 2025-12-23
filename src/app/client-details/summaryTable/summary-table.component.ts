import { Component, Input, OnInit } from '@angular/core';
import { CommonService } from '../../services/common.service';

@Component({
  selector: 'app-summary-table',
  templateUrl: './summary-table.component.html',
  styleUrls: ['./summary-table.component.scss'],
  standalone: false,
})
export class SummaryTableComponent implements OnInit {
  @Input() selectedChips: any;
  @Input() client: any;
  theme: string;
  isd = Intl.NumberFormat('en-IN');

  constructor(private commonService: CommonService) {}

  ngOnInit() {
    this.theme = this.commonService.getTheme();
  }

  getQuickMenuPrincipal() {
    return `₹ ${this.isd.format(
      this.selectedChips.reduce((a, b) => a + b.principal, 0) || 0
    )}`;
  }

  getQuickMenuInterest() {
    return `₹ ${this.isd.format(
      this.selectedChips.reduce((a, b) => a + b.interest, 0) || 0
    )}`;
  }

  getQuickMenuTotal() {
    return `₹ ${this.isd.format(
      this.selectedChips.reduce((a, b) => a + b.principal + b.interest, 0) || 0
    )}`;
  }
}
