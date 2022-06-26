import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ClientDataService } from '../services/client-data.service';

@Component({
  selector: 'app-add-client',
  templateUrl: './add-client.page.html',
  styleUrls: ['./add-client.page.scss'],
})
export class AddClientPage {
  isAddBtnDisable: boolean;
  clientsData = [];
  formRefVariable: any;
  today: any;
  recordType = 'credit';

  constructor(
    private clientDataService: ClientDataService,
    private router: Router
  ) {}

  ionViewWillEnter() {
    this.isAddBtnDisable = false;
    this.clientDataService.getAllClientsData().then((res) => {
      this.clientsData = res;
    });
    this.today = this.clientDataService.today;
  }

  onSubmit(formRef) {
    this.formRefVariable = formRef;
    if (formRef.valid) {
      this.isAddBtnDisable = true;
      this.clientDataService
        .addNewClientData(formRef.value, this.recordType)
        .then((res) => {
          this.clientDataService.presentLoading();
          this.routeToClientList(formRef);
        });
    }
  }

  routeToClientList(formRef) {
    let message = '';
    if (formRef.value.multiRecordsSelected) {
      message = 'New record added to the client successfully.';
      setTimeout(() => {
        this.isAddBtnDisable = false;
        this.clientDataService.presentToast(message);
      }, 1000);
    } else {
      message =
        'New client record added successfully,<br>Redirecting to Clients list tab.';
      setTimeout(() => {
        this.isAddBtnDisable = false;
        this.clientDataService.presentToast(message);
        this.router.navigateByUrl('/clida/clients-list').then(() => {
          formRef.resetForm();
        });
      }, 1000);
    }
  }
}
