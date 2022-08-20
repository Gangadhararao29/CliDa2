import { Component, OnInit, ViewChild } from '@angular/core';
import { ClientDataService } from '../services/client-data.service';

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
  showfilterRangeErrorText = false;
  showNoRecords = false;
  constructor(private clientDataService: ClientDataService) {}

  ngOnInit() {
    const storedValue = JSON.parse(localStorage.getItem('sortAndFilterParams'));
    this.sortAndFilterParams = storedValue ? storedValue : [];
  }

  addNewParams(formRef) {
    if (this.checkFormValidation(formRef.value)) {
      this.removeAllErrors();
      this.sortAndFilterParams.push({
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
        this.showfilterRangeErrorText = !(
          formValue.filterMax && formValue.filterMin
        );
        return !this.showfilterRangeErrorText;
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
    this.showfilterRangeErrorText = false;
  }

  postAdditionNewParams() {
    this.modal.dismiss();
    this.clientDataService.presentToast('New model added');
    this.sortAndFilterParams.forEach((ele) => (ele.active = 'light'));
    localStorage.setItem(
      'sortAndFilterParams',
      JSON.stringify(this.sortAndFilterParams)
    );
  }

  async applyParams(index) {
    const paramsModel = this.sortAndFilterParams[index];
    if (paramsModel.active === 'light') {
      this.sortAndFilterParams.forEach((ele) => {
        ele.active = 'light';
      });
      paramsModel.active = 'primary';
    } else {
      paramsModel.active = 'light';
      this.displayData = [];
      return;
    }

    if (paramsModel.sort.by === 'name') {
      await this.clientDataService
        .orderByName(paramsModel.sort.order)
        .then((res) => {
          this.displayData = res;
          if (paramsModel.filter.by) {
            this.filterDataModel(paramsModel);
          }
          this.showNoRecords = this.displayData.length ? false : true;
        });
    } else {
      await this.clientDataService.getAllClientsDataWithKeys().then((res) => {
        this.displayData = res;
        this.sortDataModel(paramsModel);
        if (paramsModel.filter.by) {
          this.filterDataModel(paramsModel);
        }
        this.showNoRecords = this.displayData.length ? false : true;
      });
    }
  }

  filterDataModel(paramsModel) {
    if (paramsModel.filter.by === 'principal') {
      this.displayData = this.displayData.filter((ele) => {
        ele.data.data = ele.data.data.filter(
          (rec) =>
            rec.principal >= paramsModel.filter.min &&
            rec.principal <= paramsModel.filter.max
        );
        return ele.data.data.length;
      });
    } else {
      this.displayData = this.displayData.filter((ele) => {
        ele.data.data = ele.data.data.filter(
          (rec) =>
            this.clientDataService.calculateTimeperiod(rec.startDate).tm /
              12.0 >=
              paramsModel.filter.min &&
            this.clientDataService.calculateTimeperiod(rec.startDate).tm /
              12.0 <=
              paramsModel.filter.max
        );
        return ele.data.data.length;
      });
    }
  }

  sortDataModel(paramsModel) {
    this.displayData.forEach((ele) => {
      ele.data.data.sort((a, b) => {
        const keyA = new Date(a.startDate);
        const keyB = new Date(b.startDate);
        if (keyA < keyB) {
          return paramsModel.sort.order === 'asc' ? +1 : -1;
        }
        if (keyA > keyB) {
          return paramsModel.sort.order === 'asc' ? -1 : +1;
        }
      });
    });

    this.displayData.sort((a, b) => {
      const keyA = new Date(a.data.data[0].startDate);
      const keyB = new Date(b.data.data[0].startDate);
      if (keyA < keyB) {
        return paramsModel.sort.order === 'asc' ? +1 : -1;
      }
      if (keyA > keyB) {
        return paramsModel.sort.order === 'asc' ? -1 : +1;
      }
    });
  }

  deleteAllParams() {
    this.sortAndFilterParams.pop();
    localStorage.setItem(
      'sortAndFilterParams',
      JSON.stringify(this.sortAndFilterParams)
    );
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
      return 'secondary';
    } else {
      return 'primary';
    }
  }
}
