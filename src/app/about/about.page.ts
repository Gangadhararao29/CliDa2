import { Component, ElementRef, ViewChild } from '@angular/core';
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
  @ViewChild('fileInput', { static: false }) inputVar: ElementRef;
  downloadJsonHref: any;
  importedJSON: any;
  jsonFile: any;
  title = 'Export/Import';
  clientsData;

  constructor(
    private sanitizer: DomSanitizer,
    public alertController: AlertController,
    private toastController: ToastController,
    private router: Router,
    private clientDataService: ClientDataService
  ) {}

  ionViewWillEnter() {}
  exportData() {
    //const clientsData = ''; //JSON.parse(this.cds.getClientsData());
    this.clientDataService.getAllClientsData().then((data) => {
      this.clientsData = data.value;
      this.writeSecretFile(this.clientsData);
      this.downloadJsonHref = this.sanitizer.bypassSecurityTrustUrl(
        'data:text/json;charset=UTF-8,' + encodeURIComponent(this.clientsData)
      );
    });
  }
  importData(target) {
    this.jsonFile = target.files.item(0);
    this.presentAlert(this.jsonFile);
  }

  async writeSecretFile(clientsDataString: string) {
    const fileName = `Cli-da/clientsData_${new Date()
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
          `File saved Successfully.<br>Path:/Documents/${fileName}`,
          3500
        );
      })
      .catch((err) => {
        this.presentToast(
          'No data to Export <br>Import clients or  Add clients to continue',
          3500
        );
      });
  }

  async presentAlert(file) {
    const alert = await this.alertController.create({
      header: 'Existing Data will?',
      buttons: [
        {
          text: 'Merge with new data',
          handler: () => {
            this.importHandler(file, false);
          },
        },
        {
          text: 'Replace with new data',
          handler: () => {
            this.importHandler(file, true);
          },
        },
        {
          text: 'Cancel',
          handler: () => {
            this.inputVar.nativeElement.value = null;
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
          this.inputVar.nativeElement.value = null;
          this.presentToast(
            'Data imported succcessfully <br>Redirecting to Clients List Tab',
            2500
          );

          setTimeout(() => {
            // this.router.navigate(['clida', 'clientsList']).then(() => {});
          }, 2000);
        });
    };
  }

  async presentToast(message, duration) {
    const toast = await this.toastController.create({
      message,
      position: 'top',
      duration,
    });
    toast.present();
  }

  resetData() {
    this.clientDataService.deleteDataBase();
    const message = 'Data successfully deleted';
    this.presentToast(message, 2000);
  }
}
