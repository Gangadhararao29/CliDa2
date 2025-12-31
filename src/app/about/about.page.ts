import { Component, Renderer2, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { HttpClient } from '@angular/common/http';
import { App } from '@capacitor/app';
import { read, utils, writeFileXLSX } from 'xlsx';
import { Capacitor } from '@capacitor/core';
import { FirebaseService } from '../services/firebase.service';
import { CommonService } from '../services/common.service';
import { DataBaseService } from '../services/data-base.service';
import { NotificationService, NotificationSettings, PaymentNotification } from '../services/notification.service';

@Component({
  selector: 'app-about',
  templateUrl: './about.page.html',
  styleUrls: ['./about.page.scss'],
  standalone: false,
})
export class AboutPage {
  @ViewChild('modal') modal: any;
  @ViewChild('select2') select2;

  themeName = localStorage.getItem('theme');
  inputClientData: any;
  isUpdateLoading = false;
  isModalOpen = false;
  latestVersion = '0.0.0';
  currentVersion = '3.25.12';
  gitHubResponse = [];
  loadingData = true;
  user: any = null;
  fileType = 'json';
  theme: string;
  isWebVersion: boolean = false;
  isUpdateAvailable = false;
  notificationSettings: NotificationSettings = {
    enabled: false,
    notifyBeforeMonths: 2,
    minimumAgeYears: 2,
    reminderIntervalWeeks: 2
  };
  notifications: any[] = [];
  isNotificationModalOpen = false;

  constructor(
    public alertController: AlertController,
    private router: Router,
    private renderer: Renderer2,
    private httpClient: HttpClient,
    private firebaseService: FirebaseService,
    private commonService: CommonService,
    private dataBaseService: DataBaseService,
    private notificationService: NotificationService
  ) { }

  ionViewWillEnter() {
    this.isWebVersion = Capacitor.getPlatform() != 'web' ? false : true;
    this.theme = this.commonService.getTheme();
    if (this.isWebVersion) {
      this.firebaseService.onAuthStateChanged((user) => {
        this.user = user ?? null;
        this.loadingData = false;
      });
    } else {
      this.loadingData = false;
    }
    this.notificationSettings = this.notificationService.getSettings();
    this.loadNotifications();
  }

  ionViewDidEnter() {
    const lv = this.latestVersion.split('.');
    const cv = this.currentVersion.split('.');
    this.isUpdateAvailable = lv[0] > cv[0] || lv[1] > cv[1] || lv[2] > cv[2];
  }

  checkForUpdate() {
    this.isUpdateLoading = true;
    this.isModalOpen = false;
    App.getInfo().then((suc) => {
      this.currentVersion = suc.version;
    });
    this.httpClient
      .get('https://api.github.com/repos/gangadhararao29/clida2/releases')
      .subscribe((res: Array<any>) => {
        this.gitHubResponse = res;
        this.latestVersion = this.gitHubResponse[0].tag_name.slice(1);
        this.isUpdateLoading = false;
        this.isModalOpen = true;
      });
  }

  setOpen(isOpen: boolean) {
    this.isModalOpen = isOpen;
  }

  exportData() {
    this.dataBaseService.getAllClientsData().then((data) => {
      if (this.fileType === 'json') {
        const userObj = this.commonService.getUserPreferences();
        userObj.userData = data;
        const clientDataString = JSON.stringify(userObj);
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
    a.download = `clientsData_${new Date().toJSON().slice(0, 10)}.json`;
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
        this.commonService.presentToast(
          `The file has been saved successfully in <br> Documents/${fileName}.`
        );
      })
      .catch((err) => {
        const errString = 'No data found. <br>' + err.toString().slice(6);
        this.commonService.presentToast(
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
        try {
          this.importDataAlert(JSON.parse(fileReader.result.toString()));
        } catch (err) {
          this.commonService.presentToast(
            err,
            'failedToastClass',
            'alert-outline'
          );
          this.inputClientData = '';
        }
      };
    }
  }

  async importDataAlert(clientsData) {
    const alert = await this.alertController.create({
      header: 'Import data',
      message: 'You already have data. How would you like to handle it?',
      cssClass: 'alertMultiStyle',
      backdropDismiss: false,
      animated: true,
      buttons: [
        {
          text: 'Replace existing',
          cssClass: 'bg-primary',
          handler: () => {
            this.commonService.presentLoading();
            this.importHandler(clientsData, true);
          },
        },
        {
          text: 'Merge with existing',
          cssClass: 'bg-primary',
          handler: () => {
            this.commonService.presentLoading();
            this.importHandler(clientsData, false);
          },
        },
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => {
            this.inputClientData = '';
          },
        },
      ],
    });
    await alert.present();
  }

  importHandler(clientsData, replaceStatus) {
    if (clientsData.hasOwnProperty('userData')) {
      this.commonService.setUserPreferences(clientsData);
      clientsData = clientsData.userData;
    }
    this.dataBaseService
      .saveBulkClients(clientsData, replaceStatus)
      .then(() => {
        setTimeout(() => {
          this.inputClientData = '';
          this.commonService.presentToast(
            'Data imported successfully. <br> Redirecting to the Clients List tab.'
          );
          this.router.navigate(['clients-list']);
        }, 1000);
      });
  }

  async presentDeleteAlert() {
    const alert = await this.alertController.create({
      header: 'Reset app data?',
      message: 'This will remove all saved data and restore default settings.',
      backdropDismiss: false,
      animated: true,
      cssClass: 'alertStyle',
      buttons: [
        {
          text: 'Reset',
          role: 'submit',
          cssClass: 'bg-danger',
          handler: () => {
            this.resetData();
          },
        },
        {
          text: 'Cancel',
          role: 'cancel',
        },
      ],
    });
    await alert.present();
  }

  resetData() {
    this.dataBaseService.deleteDataBase();
    localStorage.clear();
    this.changeTheme({ detail: { value: 'auto' } });
    this.select2.value = 'auto';
    this.commonService.presentToast(
      'The factory reset has been completed successfully.'
    );
  }

  handleThemeBtnClick() {
    this.select2?.el?.click();
  }

  changeTheme(event) {
    localStorage.setItem('theme', event.detail.value);
    this.theme = event.detail.value;
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
          this.theme = 'dark';
          this.renderer.addClass(document.body, 'dark');
        } else {
          this.theme = 'light';
          this.renderer.removeClass(document.body, 'dark');
        }
        break;
      }
    }
  }

  changeSort(event) {
    if (event.target.value) {
      this.commonService.presentLoading();
      event.target.disabled = true;
      this.dataBaseService.getAllClientsData().then((clients) => {
        clients.map((ele) => {
          ele.data.sort((a, b) => {
            let keyA = new Date(a.startDate);
            let keyB = new Date(b.startDate);
            if (!(a.closedOn && b.closedOn)) {
              if (a.closedOn) keyA = new Date();
              if (b.closedOn) keyB = new Date();
            }
            return keyA < keyB ? -1 : +1;
          });
        });

        if (event.target.value === 'name') {
          clients.sort((a, b) => (a.name < b.name ? -1 : +1));
        } else if (event.target.value === 'year') {
          clients.sort((a, b) => {
            let keyA = new Date(a.data[0].startDate);
            let keyB = new Date(b.data[0].startDate);
            if (!(a.data[0].closedOn && b.data[0].closedOn)) {
              if (a.data[0].closedOn) keyA = new Date();
              if (b.data[0].closedOn) keyB = new Date();
            }
            return keyA < keyB ? -1 : +1;
          });
        }

        this.dataBaseService.saveBulkClients(clients, true).then((res) => {
          setTimeout(() => {
            this.commonService.presentToast(
              'The data has been sorted successfully.'
            );
            event.target.disabled = false;
            event.target.value = null;
          }, 1000);
        });
      });
    }
  }

  cleanData() {
    this.dataBaseService.cleanClientsData().then((res) => {
      this.commonService.presentLoading().then(() => {
        this.commonService.presentToast(
          'All empty data and errors have been fixed.'
        );
      });
    });
  }

  cleanApproveData() {
    this.dataBaseService.cleanApprovedData().then((res) => {
      this.commonService.presentLoading().then(() => {
        this.commonService.presentToast('All approved data has been removed.');
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

  async signInWithGoogle() {
    try {
      this.user = await this.firebaseService.signInWithGoogle();
      this.commonService.presentToast('You have signed in successfully.');
    } catch (err: any) {
      this.commonService.presentToast(
        err.message,
        'failedToastClass',
        'alert-outline'
      );
    }
  }

  async logOutUser() {
    try {
      await this.firebaseService.signOutUser();
      this.user = null;
      this.commonService.presentToast('You have signed out successfully.');
    } catch (error) {
      this.commonService.presentToast(
        'Error signing out: <br>' + error,
        'failedToastClass',
        'alert-outline'
      );
    }
  }

  async loadCloudData() {
    try {
      const res = await this.firebaseService.loadCloudData(this.user?.uid);
      if (!res.length) {
        this.commonService.presentToast('No data was found.');
      } else {
        this.importDataAlert(res);
      }
    } catch (error) {
      console.log('Error loading cloud data:', error);
      this.commonService.presentToast(
        'Error loading cloud data: <br>' + error,
        'failedToastClass',
        'alert-outline'
      );
    }
  }

  async uploadToCloud() {
    try {
      const clientsData = await this.dataBaseService.getAllClientsData();
      await this.firebaseService.uploadToCloud(this.user.uid, clientsData);
      this.commonService.presentLoading();
      setTimeout(() => {
        this.commonService.presentToast('The upload was successful.');
      }, 1500);
    } catch (error) {
      this.commonService.presentToast(
        'Error uploading data to cloud: <br>' + error,
        'failedToastClass',
        'alert-outline'
      );
    }
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
    this.dataBaseService.saveBulkClients(clientsData, true).then(() => {
      setTimeout(() => {
        this.inputClientData = '';
        this.commonService.presentToast(
          'Data imported successfully <br>Redirecting to Clients-list tab'
        );
        this.router.navigate(['clients-list']);
      }, 1000);
    });
  }

  get lastCloudSync(): string | null {
    return localStorage.getItem('lastCloudSync');
  }

  get lastDataModified(): string | null {
    return localStorage.getItem('lastDataModified');
  }

  get isBackupNeeded(): boolean {
    const sync = this.lastCloudSync;
    const modified = this.lastDataModified;
    if (!modified) return false;
    if (!sync) return true;
    return new Date(modified) > new Date(sync);
  }

  // Notification Methods

  loadNotifications() {
    const raw = this.notificationService.getAllNotifications();
    this.notifications = raw;
  }

  onNotificationToggle() {
    if (this.notificationSettings.enabled) {
      this.notificationService.requestPermission(true).then(granted => {
        if (!granted) {
          this.notificationSettings.enabled = false;
          this.commonService.presentToast('Notification permission denied', 'failedToastClass', 'alert-outline');
        }
        this.saveNotificationSettings();
      });
    } else {
      this.saveNotificationSettings();
    }
  }

  saveNotificationSettings() {
    this.notificationService.saveSettings(this.notificationSettings);
  }

  async openNotifications() {
    const rawNotifications = this.notificationService.getAllNotifications();
    if (rawNotifications.length === 0) {
      this.notifications = [];
      this.isNotificationModalOpen = true;
      return;
    }

    const allClients = await this.dataBaseService.getAllClientsDataWithKeys();

    this.notifications = rawNotifications.map(note => {
      const client = allClients.find(c => c.key === note.clientId);
      if (!client) return null;

      const transaction = client.data.data.find(t => t.id === note.transactionId);
      if (!transaction) return null;

      return {
        ...note,
        clientName: client.data.name,
        amount: transaction.principal
      };
    }).filter(n => n !== null);

    this.isNotificationModalOpen = true;
  }

  markAsRead(notification: any) {
    this.notificationService.markAsRead(notification.id);
    const note = this.notifications.find(n => n.id === notification.id);
    if (note) note.read = true;
  }

  dismissNotification(notification: any) {
    this.notificationService.dismissNotification(notification.id);
    this.notifications = this.notifications.filter(n => n.id !== notification.id);
  }

  clearAllNotifications() {
    this.notificationService.clearAllNotifications();
    this.notifications = [];
  }
}
