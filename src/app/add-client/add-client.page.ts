import { Component, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ClientDataService } from '../services/client-data.service';

@Component({
  selector: 'app-add-client',
  templateUrl: './add-client.page.html',
  styleUrls: ['./add-client.page.scss'],
})
export class AddClientPage {
  @ViewChild('formRef') formRefVariable: any;
  isAddBtnDisable: boolean;
  clientsData = [];
  today: any;
  theme: string;

  constructor(
    private clientDataService: ClientDataService,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {}

  ionViewWillEnter() {
    this.theme = this.clientDataService.getTheme();
    this.isAddBtnDisable = false;
    this.formRefVariable.resetForm();
    this.clientDataService.getAllClientsData().then((res) => {
      this.clientsData = res;
    });

    this.formRefVariable.form.patchValue({
      userName: this.activatedRoute.snapshot.queryParamMap.get('name'),
      startDate: this.clientDataService.today,
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
      this.clientDataService.addNewClientData(formRef.value).then((res) => {
        this.clientDataService.presentLoading();
        this.routeToClientList(formRef);
      });
    }
  }

  routeToClientList(formRef) {
    let message = 'New client record added successfully.';
    message += formRef.value.multiRecordsSelected
      ? ''
      : '<br>Redirecting to Clients-list tab.';

    setTimeout(() => {
      this.isAddBtnDisable = false;
      this.clientDataService.presentToast(message);
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
