import { Component, OnInit, ViewChild } from '@angular/core';
import { ClientDataService } from '../services/client-data.service';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-adv-search',
  templateUrl: './adv-search.page.html',
  styleUrls: ['./adv-search.page.scss'],
})
export class AdvSearchPage implements OnInit {
  @ViewChild('modal') modal: any;
  sortAndFilterParams = [];
  displayData = [];
  showSortMissingText = false;
  showFilterMissingText = false;
  showfilterRangeErrorText = true;
  showNoRecords = false;
  hideSkeletonText = true;

  constructor(private clientDataService: ClientDataService) {}

  ngOnInit() {
    const storedValue = JSON.parse(localStorage.getItem('sortAndFilterParams'));
    this.sortAndFilterParams = storedValue ? storedValue : [];
  }

  addNewParams(formRef) {
    if (this.checkFormValidation(formRef.value)) {
      this.removeAllErrors();
      this.sortAndFilterParams.unshift({
        active: 'light',
        sort: {
          by: formRef.value.sortBy,
          order: formRef.value.sortOrder,
        },
        filter: {
          by: formRef.value.filterBy,
          min: formRef.value.filterMin,
          max: formRef.value.filterMax,
        },
      });
      this.postAdditionNewParams();
    }
  }

  checkFormValidation(formValue) {
    if (formValue.sortBy || formValue.filterBy) {
      if (formValue.filterBy) {
        this.showfilterRangeErrorText =
          formValue.filterMin || formValue.filterMax;
        return this.showfilterRangeErrorText;
      }
      return true;
    } else {
      this.showFilterMissingText = true;
      this.showSortMissingText = true;
      return false;
    }
  }

  removeAllErrors() {
    this.showSortMissingText = false;
    this.showFilterMissingText = false;
    this.showfilterRangeErrorText = true;
  }

  postAdditionNewParams() {
    this.modal.dismiss();
    this.clientDataService.presentToast('New model added');
    this.sortAndFilterParams.forEach((ele) => (ele.active = 'light'));
    localStorage.setItem(
      'sortAndFilterParams',
      JSON.stringify(this.sortAndFilterParams)
    );
    const firstCard = document.getElementById('paramscard0');
    if (firstCard) {
      firstCard.scrollIntoView({
        inline: 'end',
        block: 'center',
      });
    }
  }

  applyParams(index) {
    this.hideSkeletonText = false;
    const paramsModel = this.sortAndFilterParams[index];
    if (paramsModel.active === 'light') {
      this.sortAndFilterParams.forEach((ele) => {
        ele.active = 'light';
      });
      paramsModel.active = 'primary';
    } else {
      paramsModel.active = 'light';
      this.displayData = [];
      this.hideSkeletonText = true;
      return;
    }

    this.clientDataService.getAllClientsDataWithKeys().then((res) => {
      this.displayData = res;
      if (paramsModel.filter.by) {
        this.filterDataModel(paramsModel);
      }
      if (paramsModel.sort.by) {
        this.sortDataModel(paramsModel);
      }
      this.hideSkeletonText = true;
      this.showNoRecords = this.displayData.length === 0;
    });
  }

  filterDataModel(paramsModel) {
    this.displayData = this.displayData.filter((ele) => {
      ele.data.data = ele.data.data.filter((rec) => {
        const timePeriod =
          this.clientDataService.calculateTimeperiod(rec.startDate).tm / 12.0;
        if (paramsModel.filter.by === 'principal') {
          return (
            rec.principal >= paramsModel.filter.min &&
            rec.principal <= paramsModel.filter.max
          );
        } else {
          return (
            timePeriod >= paramsModel.filter.min &&
            timePeriod <= paramsModel.filter.max
          );
        }
      });
      return ele.data.data.length > 0;
    });
  }

  sortDataModel(paramsModel) {
    if (paramsModel.sort.by === 'time') {
      this.displayData.forEach((ele) => {
        ele.data.data.sort((a, b) => {
          const keyA = new Date(a.startDate);
          const keyB = new Date(b.startDate);
          return (
            (paramsModel.sort.order === 'asc' ? -1 : 1) *
            (keyA.getTime() - keyB.getTime())
          );
        });
      });

      this.displayData.sort((a, b) => {
        const keyA = new Date(a.data.data[0].startDate);
        const keyB = new Date(b.data.data[0].startDate);
        return (
          (paramsModel.sort.order === 'asc' ? -1 : 1) *
          (keyA.getTime() - keyB.getTime())
        );
      });
    }

    if (paramsModel.sort.by === 'name') {
      this.displayData.sort(
        (a, b) =>
          (paramsModel.sort.order === 'des' ? -1 : 1) *
          a.data.name.localeCompare(b.data.name)
      );
    }
  }

  deleteActiveParam() {
    const paramIndex = this.sortAndFilterParams.findIndex(
      (ele) => ele.active === 'primary'
    );
    if (paramIndex > -1) {
      this.sortAndFilterParams.splice(paramIndex, 1);
      this.displayData = [];
      localStorage.setItem(
        'sortAndFilterParams',
        JSON.stringify(this.sortAndFilterParams)
      );
      this.clientDataService.presentToast('Params deleted successfuly');
    } else {
      this.clientDataService.presentToast(
        'Select any params to delete',
        'failedToastClass',
        'alert-outline'
      );
    }
  }

  getColor(detail) {
    const tm = this.clientDataService.calculateTimeperiod(detail?.startDate).tm;
    if (detail?.closedOn) {
      return 'success';
    } else if (tm >= 30) {
      return 'danger';
    } else if (tm >= 24) {
      return 'warning';
    } else if (tm >= 12) {
      return 'primary';
    } else {
      return 'medium';
    }
  }

  ionViewWillLeave() {
    if (this.modal) this.modal.dismiss();
  }
}
