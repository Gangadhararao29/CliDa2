import { Component, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DataBaseService } from '../services/data-base.service';
import { CommonService } from '../services/common.service';

@Component({
  selector: 'app-add-client',
  templateUrl: './add-client.page.html',
  styleUrls: ['./add-client.page.scss'],
  standalone: false,
})
export class AddClientPage {
  @ViewChild('formRef') formRefVariable: any;
  isAddBtnDisable: boolean;
  clientsData = [];
  today: any;
  theme: string;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private dataBaseService: DataBaseService,
    private commonService: CommonService
  ) {}

  ionViewWillEnter() {
    this.theme = this.commonService.getTheme();
    this.isAddBtnDisable = false;
    this.formRefVariable.resetForm();
    this.dataBaseService.getAllClientsData().then((res) => {
      this.clientsData = res;
    });

    this.formRefVariable.form.patchValue({
      userName: this.activatedRoute.snapshot.queryParamMap.get('name'),
      startDate: this.commonService.today,
      recordType: 'credit',
    });
  }

  getCommentHeight(event) {
    event.target.style.height = 0;
    event.target.style.height = `${event.target.scrollHeight}px`;
  }

  onSubmit(formRef) {
    if (formRef.valid) {
      this.isAddBtnDisable = true;
      this.dataBaseService.addNewClientData(formRef.value).then((res) => {
        this.commonService.presentLoading();
        this.routeToClientList(formRef);
      });
    }
  }

  routeToClientList(formRef) {
    let message = 'The client has been added successfully.';
    message += formRef.value.multiRecordsSelected
      ? ''
      : '<br>Redirecting to the Clients List tab.';

    setTimeout(() => {
      this.isAddBtnDisable = false;
      this.commonService.presentToast(message);
      if (!formRef.value.multiRecordsSelected) {
        this.router.navigate(['..']).then(() => {
          formRef.resetForm();
        });
      }
    }, 1000);
  }

  changeRadio(event) {
    this.formRefVariable.form.controls.recordType.setValue(event);
  }
}
