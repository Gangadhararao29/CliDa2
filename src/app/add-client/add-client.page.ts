import { Component, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
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

  constructor(
    private clientDataService: ClientDataService,
    private router: Router
  ) {}

  ionViewWillEnter() {
    this.isAddBtnDisable = false;
    this.formRefVariable.form.reset();
    this.clientDataService.getAllClientsData().then((res) => {
      this.clientsData = res;
    });
    this.formRefVariable.form.patchValue({
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
    let message = 'New client record added successfully';
    message += formRef.value.multiRecordsSelected
      ? ''
      : '<br>Redirecting to Clients list tab.';

    setTimeout(() => {
      this.isAddBtnDisable = false;
      this.clientDataService.presentToast(message);
      if (!formRef.value.multiRecordsSelected) {
        this.router.navigateByUrl('/clida/clients-list').then(() => {
          formRef.resetForm();
        });
      }
    }, 1000);
  }
}
