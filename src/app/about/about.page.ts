import { Component, Renderer2 } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { ClientDataService } from '../services/client-data.service';

@Component({
  selector: 'app-about',
  templateUrl: './about.page.html',
  styleUrls: ['./about.page.scss'],
})
export class AboutPage {
  downloadJsonHref: any;
  importedJSON: any;
  jsonFile: any;
  clientsData: string;
  darkModeFlag = false;
  themeName = localStorage.getItem('theme');
  inputClientData: any;
  sortValue: any;

  constructor(
    private sanitizer: DomSanitizer,
    public alertController: AlertController,
    private toastController: ToastController,
    private router: Router,
    private clientDataService: ClientDataService,
    private renderer: Renderer2
  ) {}

  exportData() {
    this.clientDataService.getRawClients().then((data) => {
      this.clientsData = JSON.stringify(data);
      this.writeSecretFile(this.clientsData);
      this.downloadJsonHref = this.sanitizer.bypassSecurityTrustUrl(
        'data:text/json;charset=UTF-8,' + encodeURIComponent(this.clientsData)
      );
    });
  }
  async writeSecretFile(clientsDataString: string) {
    const fileName = `CliDa/clientsData_${new Date()
      .toJSON()
      .slice(0, 10)}.json`;
    await Filesystem.writeFile({
      path: fileName,
      data: clientsDataString,
      directory: Directory.Documents,
      encoding: Encoding.UTF8,
      recursive: true,
    })
      .then(() => {
        this.presentToast(
          `File saved successfully in <br> Documents/${fileName}.`,
          2500,
          'successToastClass',
          'checkmark-outline'
        );
      })
      .catch((err) => {
        const errString = 'No Data found.<br>' + err.toString().slice(6);
        this.presentToast(errString, 2500, 'failedToastClass', 'alert-outline');
      });
  }

  importData(target) {
    this.jsonFile = target.files.item(0);
    this.presentImportDataAlert(this.jsonFile);
  }

  async presentImportDataAlert(file) {
    const alert = await this.alertController.create({
      header: 'Existing Data will?',
      cssClass: 'alertMultiStyle',
      backdropDismiss: false,
      animated: true,
      buttons: [
        {
          text: 'Replace with new data',
          handler: () => {
            this.importHandler(file, true);
          },
        },
        {
          text: 'Merge with new data',
          handler: () => {
            this.importHandler(file, false);
          },
        },
        {
          text: 'Cancel',
          handler: () => {
            this.inputClientData = '';
          },
        },
      ],
    });
    await alert.present();
  }

  importHandler(file, replaceStatus) {
    const fileReader = new FileReader();
    fileReader.readAsText(file);
    fileReader.onload = (e) => {
      this.importedJSON = fileReader.result;
      this.clientDataService
        .saveBulkClients(this.importedJSON, replaceStatus)
        .then((res) => {
          this.inputClientData = '';
          this.presentToast(
            'Data imported succcessfully <br>Redirecting to Clients List Tab',
            2000,
            'successToastClass',
            'checkmark-outline'
          );

          setTimeout(() => {
            this.router.navigate(['clida', 'clients-list']);
          }, 1500);
        });
    };
  }

  async presentToast(message, duration, cssClass, icon) {
    const toast = await this.toastController.create({
      message,
      position: 'top',
      duration,
      animated: true,
      cssClass,
      icon,
    });
    toast.present();
  }

  async presentDeleteAlert() {
    const alert = await this.alertController.create({
      header: 'Do you want to reset the app data?',
      backdropDismiss: false,
      animated: true,
      cssClass: 'alertStyle',
      buttons: [
        {
          text: 'Confirm',
          handler: () => {
            this.resetData();
          },
        },
        {
          text: 'Cancel',
          handler: () => {},
        },
      ],
    });
    await alert.present();
  }

  resetData() {
    this.clientDataService.deleteDataBase();
    const message = 'Data successfully deleted';
    this.presentToast(message, 2000, 'successToastClass', 'checkmark-outline');
  }

  changeTheme(event) {
    localStorage.setItem('theme', event.detail.value);
    if (event.detail.value === 'light') {
      this.renderer.removeClass(document.body, 'dark');
    } else if (event.detail.value === 'dark') {
      this.renderer.addClass(document.body, 'dark');
    } else {
      const preferColorMode = window.matchMedia('(prefers-color-scheme:dark)');
      if (preferColorMode) {
        this.renderer.addClass(document.body, 'dark');
      } else {
        this.renderer.removeClass(document.body, 'dark');
      }
    }
  }

  changeSort(event) {
    if (event.target.value) {
      event.target.disabled = true;
      this.clientDataService.getRawClients().then((clients) => {
        clients.map((ele) => {
          ele.data.sort((a, b) => {
            const keyA = new Date(a.startDate);
            const keyB = new Date(b.startDate);
            return keyA < keyB ? -1 : +1;
          });
        });

        if (event.target.value === 'name') {
          clients.sort((a, b) => (a.name < b.name ? -1 : +1));
        } else if (event.target.value === 'year') {
          clients.sort((a, b) => {
            const keyA = new Date(a.data[0].startDate);
            const keyB = new Date(b.data[0].startDate);
            return keyA < keyB ? -1 : +1;
          });
        }

        this.clientDataService
          .saveBulkClients(JSON.stringify(clients), true)
          .then((res) => {
            this.presentToast(
              'Data sorted successfully',
              2500,
              'successToastClass',
              'checkmark-outline'
            );
            event.target.disabled = false;
            event.target.value = null;
          });
      });
    }
  }
}
