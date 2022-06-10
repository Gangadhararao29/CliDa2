import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
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
    private router: Router,
    private toastController: ToastController
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
      this.clientDataService
        .addNewClientData(formRef.value, this.recordType)
        .then((res) => {
          this.routeToClientList(formRef);
        });
    }
  }

  routeToClientList(formRef) {
    let message = '';
    if (formRef.value.multiRecordsSelected) {
      message = 'New record added to the client successfully.';
      this.isAddBtnDisable = false;
      this.presentToast(message);
    } else {
      message =
        'New client record added successfully,<br>Redirecting to Clients list tab.';
      this.presentToast(message);
      setTimeout(() => {
        this.router.navigateByUrl('/clida/clients-list').then(() => {
          formRef.resetForm();
        });
      }, 1500);
    }
  }

  async presentToast(message) {
    const toast = await this.toastController.create({
      message,
      position: 'top',
      duration: 2500,
      animated: true,
      cssClass: 'successToastClass',
      icon: 'checkmark-outline',
    });
    toast.present();
  }
}
