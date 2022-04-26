import { Component, ElementRef, ViewChild } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { ClientDataService } from '../services/client-data.service';

@Component({
  selector: 'app-adv-search',
  templateUrl: './adv-search.page.html',
  styleUrls: ['./adv-search.page.scss'],
})
export class AdvSearchPage {
  @ViewChild('formInput') formInputElement: ElementRef;
  sortAndFilterParams = [];
  showErrorText = false;
  displayData = [];
  constructor(
    public toastController: ToastController,
    private clientDataService: ClientDataService
  ) {}

  ionViewWillEnter() {
    const storedValue = JSON.parse(localStorage.getItem('sortAndFilterParams'));
    this.sortAndFilterParams = storedValue ? storedValue : [];
  }

  addNewParams(formRef) {
    if (
      formRef.value.sortBy ||
      (formRef.value.filterBy &&
        formRef.value.filterMax > formRef.value.filterMin)
    ) {
      this.showErrorText = false;
      this.sortAndFilterParams.push({
        active: 'light',
        sort: { by: formRef.value.sortBy, order: formRef.value.sortOrder },
        filter: {
          by: formRef.value.filterBy,
          min: formRef.value.filterMin,
          max: formRef.value.filterMax,
        },
      });
      this.formInputElement.nativeElement.classList.remove('show');
      this.presentToast('New model added');
      this.sortAndFilterParams.forEach((ele) => (ele.active = 'light'));
      localStorage.setItem(
        'sortAndFilterParams',
        JSON.stringify(this.sortAndFilterParams)
      );
    } else {
      this.showErrorText = true;
    }
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
      });
    } else {
      this.clientDataService.getAllClientsData().then((res) => {
        this.displayData = res;
        this.sortDataModel(paramsModel);
        if (paramsModel.filter.by) {
          this.filterDataModel(paramsModel);
        }
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
    this.sortAndFilterParams = [];
    localStorage.setItem('sortAndFilterParams', '');
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

  async presentToast(message) {
    const toast = await this.toastController.create({
      message,
      duration: 2500,
      position: 'top',
      animated: true,
      cssClass: 'successToastClass',
      icon: 'checkmark-outline',
    });
    toast.present();
  }
}
