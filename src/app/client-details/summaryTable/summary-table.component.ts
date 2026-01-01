import { Component, Input, OnInit } from '@angular/core';
import { CommonService } from '../../services/common.service';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-summary-table',
  templateUrl: './summary-table.component.html',
  styleUrls: ['./summary-table.component.scss'],
  standalone: false,
})
export class SummaryTableComponent implements OnInit {
  @Input() selectedChips: any;
  @Input() bulkApproveHandler: () => {};
  @Input() bulkDeleteHandler: () => {};
  theme: string;
  isd = Intl.NumberFormat('en-IN');

  constructor(
    private commonService: CommonService,
    private alertController: AlertController
  ) {}

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

  async bulkApprove() {
    if (this.selectedChips.length === 0) return;

    const alert = await this.alertController.create({
      header: 'Bulk Approve',
      message: `Are you sure you want to approve/close ${this.selectedChips.length} selected transactions?`,
      cssClass: 'alertStyle',
      buttons: [
        {
          text: 'Approve All',
          cssClass: 'bg-success',
          handler: () => this.bulkApproveHandler(),
        },
        {
          text: 'Cancel',
          role: 'cancel',
        },
      ],
    });
    await alert.present();
  }

  async bulkDelete() {
    if (this.selectedChips.length === 0) return;

    const alert = await this.alertController.create({
      header: 'Bulk Delete',
      message: `Are you sure you want to PERMANENTLY delete ${this.selectedChips.length} selected transactions?`,
      cssClass: 'alertStyle',
      buttons: [
        {
          text: 'Delete All',
          cssClass: 'bg-danger',
          handler: () => this.bulkDeleteHandler(),
        },
        {
          text: 'Cancel',
          role: 'cancel',
        },
      ],
    });
    await alert.present();
  }
}
