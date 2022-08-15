import { Component, Renderer2 } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
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
    public alertController: AlertController,
    private router: Router,
    private clientDataService: ClientDataService,
    private renderer: Renderer2
  ) {}

  exportData() {
    this.clientDataService.getAllClientsData().then((data) => {
      this.clientsData = JSON.stringify(data);
      this.writeSecretFile(this.clientsData);
      this.nativeSaveByUrl();
    });
  }

  nativeSaveByUrl() {
    const a = document.createElement('a');
    const file = new Blob([this.clientsData], { type: 'text/plain' });
    a.href = URL.createObjectURL(file);
    a.download = 'clientsData.json';
    a.click();
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
        this.clientDataService.presentToast(
          `File saved successfully in <br> Documents/${fileName}.`
        );
      })
      .catch((err) => {
        const errString = 'No Data found.<br>' + err.toString().slice(6);
        this.clientDataService.presentToast(
          errString,
          'failedToastClass',
          'alert-outline'
        );
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
            this.clientDataService.presentLoading();
            this.importHandler(file, true);
          },
        },
        {
          text: 'Merge with new data',
          handler: () => {
            this.clientDataService.presentLoading();
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
          setTimeout(() => {
            this.inputClientData = '';
            this.clientDataService.presentToast(
              'Data imported succcessfully <br>Redirecting to Clients List Tab'
            );
            this.router.navigate(['clida', 'clients-list']);
          }, 1000);
        });
    };
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
    this.clientDataService.presentToast('Data successfully deleted');
  }

  changeTheme(event) {
    localStorage.setItem('theme', event.detail.value);
    switch (event.detail.value) {
      case 'light': {
        this.renderer.removeClass(document.body, 'dark');
        break;
      }
      case 'dark': {
        this.renderer.addClass(document.body, 'dark');
        break;
      }
      case 'auto': {
        const preferColorMode = window.matchMedia(
          '(prefers-color-scheme:dark)'
        );
        if (preferColorMode.matches) {
          this.renderer.addClass(document.body, 'dark');
        } else {
          this.renderer.removeClass(document.body, 'dark');
        }
        break;
      }
    }
  }

  changeSort(event) {
    if (event.target.value) {
      this.clientDataService.presentLoading();
      event.target.disabled = true;
      this.clientDataService.getAllClientsData().then((clients) => {
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
            setTimeout(() => {
              this.clientDataService.presentToast('Data sorted successfully');
              event.target.disabled = false;
              event.target.value = null;
            }, 1000);
          });
      });
    }
  }

  cleanData() {
    this.clientDataService.cleanClientsData().then((res) => {
      this.clientDataService.presentToast(
        'All the empty Data and errors are fixed.'
      );
    });
  }
}
