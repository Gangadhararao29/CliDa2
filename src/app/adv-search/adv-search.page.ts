import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ClientDataService } from '../services/client-data.service';

@Component({
  selector: 'app-adv-search',
  templateUrl: './adv-search.page.html',
  styleUrls: ['./adv-search.page.scss'],
})
export class AdvSearchPage implements OnInit {
  @ViewChild('formInput') formInputElement: ElementRef;
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
    if (
      formRef.value.sortBy ||
      (formRef.value.filterBy &&
        formRef.value.filterMax > formRef.value.filterMin)
    ) {
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
    } else {
      if (!formRef.value.sortBy) {
        this.showSortMissingText = true;
      }
      if (!formRef.value.filterBy) {
        this.showFilterMissingText = true;
      }
      if (formRef.value.filterMin >= formRef.value.filterMax) {
        this.showfilterRangeErrorText = true;
      }
    }
  }

  removeAllErrors() {
    this.showSortMissingText = false;
    this.showFilterMissingText = false;
    this.showfilterRangeErrorText = false;
  }

  postAdditionNewParams() {
    this.formInputElement.nativeElement.classList.remove('show');
    this.clientDataService.presentToast('New model added');
    this.sortAndFilterParams.forEach((ele) => (ele.active = 'light'));
    localStorage.setItem(
      'sortAndFilterParams',
      JSON.stringify(this.sortAndFilterParams)
    );
  }

  applyParams(index) {
    let paramsModel;
    this.sortAndFilterParams.forEach((ele, i) => {
      if (i === index) {
        ele.active = 'primary';
        paramsModel = ele;
      } else {
        ele.active = 'light';
      }
    });

    if (paramsModel.sort.by === 'name') {
      this.clientDataService.orderByName(paramsModel.sort.order).then((res) => {
        this.displayData = res;
        if (paramsModel.filter.by) {
          this.filterDataModel(paramsModel);
        }
        this.showNoRecords = this.displayData.length ? false : true;
      });
    } else {
      this.clientDataService.getAllClientsDataWithKeys().then((res) => {
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
          return paramsModel.sort.order === 'des' ? +1 : -1;
        }
        if (keyA > keyB) {
          return paramsModel.sort.order === 'des' ? -1 : +1;
        }
      });
    });

    this.displayData.sort((a, b) => {
      const keyA = new Date(a.data.data[0].startDate);
      const keyB = new Date(b.data.data[0].startDate);
      if (keyA < keyB) {
        return paramsModel.sort.order === 'des' ? +1 : -1;
      }
      if (keyA > keyB) {
        return paramsModel.sort.order === 'des' ? -1 : +1;
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
