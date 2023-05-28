import { Component, Renderer2, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { ClientDataService } from '../services/client-data.service';
import { HttpClient } from '@angular/common/http';
import { App } from '@capacitor/app';
import { read, utils, writeFileXLSX } from 'xlsx';

@Component({
  selector: 'app-about',
  templateUrl: './about.page.html',
  styleUrls: ['./about.page.scss'],
})
export class AboutPage {
  @ViewChild('modal') modal: any;
  themeName = localStorage.getItem('theme');
  inputClientData: any;
  isUpdateLoading = false;
  isModalOpen = false;
  latestVersion = 0;
  currentVersion = 3.8;
  gitHubResponse = [];
  loadingData = true;
  user: any = null;
  fileType = 'json';

  constructor(
    public alertController: AlertController,
    private router: Router,
    private clientDataService: ClientDataService,
    private renderer: Renderer2,
    private httpClient: HttpClient
  ) {}

  checkForUpdate() {
    this.isUpdateLoading = true;
    App.getInfo().then((suc) => {
      this.currentVersion = parseFloat(suc.version);
    });
    this.httpClient
      .get('https://api.github.com/repos/gangadhararao29/clida2/releases')
      .subscribe((res: Array<any>) => {
        this.gitHubResponse = res.filter((release) => !release.draft);
        this.latestVersion = parseFloat(
          this.gitHubResponse[0].tag_name.slice(1)
        );
        this.isUpdateLoading = false;
        this.isModalOpen = true;
      });
  }

  setOpen(isOpen: boolean) {
    this.isModalOpen = isOpen;
  }

  exportData() {
    this.clientDataService.getAllClientsData().then((data) => {
      if (this.fileType === 'json') {
        const clientDataString = JSON.stringify(data);
        this.writeSecretFile(clientDataString);
        this.nativeSaveByUrl(clientDataString);
      } else {
        this.excelExport(data);
      }
    });
  }

  nativeSaveByUrl(clientsDataString) {
    const a = document.createElement('a');
    const file = new Blob([clientsDataString], { type: 'text/plain' });
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
    if (this.fileType === 'excel') {
      this.excelImport(target);
    } else {
      const fileReader = new FileReader();
      fileReader.readAsText(target.files.item(0));
      fileReader.onload = (e) => {
        this.importDataAlert(JSON.parse(fileReader.result.toString()));
      };
    }
  }

  async importDataAlert(clientsData) {
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
            this.importHandler(clientsData, true);
          },
        },
        {
          text: 'Merge with new data',
          handler: () => {
            this.clientDataService.presentLoading();
            this.importHandler(clientsData, false);
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

  importHandler(clientsData, replaceStatus) {
    this.clientDataService
      .saveBulkClients(clientsData, replaceStatus)
      .then((res) => {
        setTimeout(() => {
          this.inputClientData = '';
          this.clientDataService.presentToast(
            'Data imported succcessfully <br>Redirecting to Clients List Tab'
          );
          this.router.navigate(['clida', 'clients-list']);
        }, 1000);
      });
  }

  async presentDeleteAlert() {
    const alert = await this.alertController.create({
      header: 'Do you want to reset the app data?',
      backdropDismiss: false,
      animated: true,
      cssClass: 'alertStyle',
      buttons: [
        {
          text: 'Yes',
          handler: () => {
            this.resetData();
          },
        },
        {
          text: 'No',
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

        this.clientDataService.saveBulkClients(clients, true).then((res) => {
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
      this.clientDataService.presentLoading().then(() => {
        this.clientDataService.presentToast(
          'All the empty Data and errors are fixed.'
        );
      });
    });
  }

  getDateString(dateString) {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  excelExport(res) {
    const fileName = `clientsData_${new Date().toJSON().slice(0, 10)}.xlsx`;
    const excelArray = [];
    res.forEach((client) => {
      client.data.forEach((record) => {
        excelArray.push({
          name: client.name,
          principal: record.principal,
          interest: record.interest,
          startDate: record.startDate,
          comments: record.comments,
          closedOn: record.closedOn,
          closedAmount: record.closedAmount,
        });
      });
    });
    const ws = utils.json_to_sheet(excelArray);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Clients Data');
    writeFileXLSX(wb, fileName);
  }

  async excelImport(target) {
    const wb = read(await target.files[0].arrayBuffer());
    const data = utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
    const clientsData = [];
    let id = Date.now();
    data.forEach((record: any) => {
      record.id = id++;
      const clientIndex = clientsData.findIndex(
        (client) => client.name === record.name
      );
      if (clientIndex > -1) {
        delete record.name;
        clientsData[clientIndex].data.push(record);
      } else {
        const newClient = record.name;
        delete record.name;
        clientsData.push({ name: newClient, data: [record] });
      }
    });
    this.clientDataService.saveBulkClients(clientsData, true).then(() => {
      setTimeout(() => {
        this.inputClientData = '';
        this.clientDataService.presentToast(
          'Data imported succcessfully <br>Redirecting to Clients List Tab'
        );
        this.router.navigate(['clida', 'clients-list']);
      }, 1000);
    });
  }

  ionViewWillLeave() {
    if (this.modal) this.modal.dismiss();
  }
}
