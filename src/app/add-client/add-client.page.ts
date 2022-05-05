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
  listType = 'credit';

  constructor(
    private clientDataService: ClientDataService,
    private router: Router,
    private toastController: ToastController
  ) {}

  ionViewWillEnter() {
    this.isAddBtnDisable = false;
    this.clientDataService.getRawClients().then((res) => {
      this.clientsData = res;
    });
    this.today = this.clientDataService.today;
  }

  onSubmit(formRef) {
    this.formRefVariable = formRef;
    if (formRef.valid) {
      const newClientData = {
        name: this.formatToCamelCase(formRef.value.userName),
        data: [
          {
            id: Date.now(),
            principal:
              this.listType === 'credit'
                ? formRef.value.principal
                : -formRef.value.principal,
            interest: formRef.value.interest,
            startDate: formRef.value.startDate,
            comments: formRef.value.comments,
          },
        ],
      };
      this.saveNewClientData(newClientData, formRef);
    }
  }

  saveNewClientData(newClientData, formRef) {
    this.isAddBtnDisable = true;
    this.clientDataService.getClientByName(newClientData.name).then((res) => {
      if (res) {
        res.data.push(newClientData.data[0]);
        this.clientDataService.updateClientRecordByName(res).then(() => {
          this.routeToClientList(formRef);
        });
      } else {
        this.clientDataService.addNewClient(newClientData).then(() => {
          this.routeToClientList(formRef);
        });
      }
    });
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

  formatToCamelCase(name: string) {
    return name.replace(
      /(^\w|\s\w)(\S*)/g,
      (_, m1, m2) => m1.toUpperCase() + m2.toLowerCase()
    );
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
