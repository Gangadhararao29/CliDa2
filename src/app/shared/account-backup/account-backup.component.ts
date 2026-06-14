import { Component, OnInit, Input } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { read, utils, writeFileXLSX } from 'xlsx';
import {
  FirebaseService,
  AutoBackupSettings,
} from '../../services/firebase.service';
import { CommonService } from '../../services/common.service';
import { DataBaseService } from '../../services/data-base.service';
import { LeaseService } from '../../services/lease.service';
import { localStorConsts, LocalStorageUtils } from '../local-storage';

@Component({
  selector: 'app-account-backup',
  templateUrl: './account-backup.component.html',
  styleUrls: ['./account-backup.component.scss'],
  standalone: false,
})
export class AccountBackupComponent implements OnInit {
  @Input() theme: string;
  @Input() hideHelp: boolean = false;

  loadingData = true;
  user: any = null;
  isWebVersion: boolean = false;
  autoBackupEnabled: boolean = false;
  backupInterval: string = '1';
  cloudSyncType: string = 'soft';
  fileType = 'json';
  inputClientData: any;

  constructor(
    public alertController: AlertController,
    private router: Router,
    private firebaseService: FirebaseService,
    private commonService: CommonService,
    private dataBaseService: DataBaseService,
    private leaseService: LeaseService,
  ) {}

  ngOnInit() {
    this.isWebVersion = Capacitor.getPlatform() !== 'web' ? false : true;
    if (this.isWebVersion) {
      this.firebaseService.onAuthStateChanged((user) => {
        this.user = user ?? null;
        this.loadingData = false;
      });
    } else {
      this.loadingData = false;
    }

    // Load auto-backup settings
    const backupSettings = this.firebaseService.getAutoBackupSettings();
    this.autoBackupEnabled = backupSettings.enabled;
    this.backupInterval = `${backupSettings.interval}`;
  }

  async signInWithGoogle() {
    try {
      this.user = await this.firebaseService.signInWithGoogle();
      this.commonService.presentToast('You have signed in successfully.');
    } catch (err: any) {
      this.commonService.presentToast(
        err.message,
        'failedToastClass',
        'alert-outline',
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
        'alert-outline',
      );
    }
  }

  async loadCloudData(isSoftRestore = false) {
    try {
      const res = await this.firebaseService.loadCloudData(this.user?.uid);
      const hasClients = res.clients.length > 0 || res.leases.length > 0;
      if (!hasClients) {
        this.commonService.presentToast('No data was found.');
      } else {
        this.importHandler(res, !isSoftRestore);
      }
    } catch (error) {
      console.log('Error loading cloud data:', error);
      this.commonService.presentToast(
        'Error loading cloud data: <br>' + error,
        'failedToastClass',
        'alert-outline',
      );
    }
  }

  async uploadToCloud(isSoftBackup = false) {
    try {
      await this.commonService.presentLoading('Uploading ...');
      let payload = await this.firebaseService.getModifiedData(
        isSoftBackup,
        this.user?.uid,
      );

      await this.commonService.dismissLoading();

      await this.uploadDataAlert(payload);
    } catch (error) {
      console.error('Error uploading data to cloud:', error);
      this.commonService.dismissLoading();
      this.commonService.presentToast(
        'Error uploading data to cloud: <br>' + error,
        'failedToastClass',
        'alert-outline',
      );
    }
  }

  async uploadDataAlert(payload: any) {
    let message = `${payload.updatedClients.length} clients updated<br>${payload.clients.length - payload.updatedClients.length} clients unmodified<br>${payload.removedClients.length} clients removed`;

    const alert = await this.alertController.create({
      header: 'Please confirm to backup your existing data?',
      cssClass: 'alertStyle',
      backdropDismiss: false,
      animated: true,
      message,
      buttons: [
        {
          text: 'Confirm',
          cssClass: 'bg-primary',
          handler: async () => await this.uploadDataHandler(payload),
        },
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => {},
        },
      ],
    });

    await alert.present();
  }

  async uploadDataHandler(payload: any) {
    await this.commonService.presentLoading('Uploading data to cloud...');
    await this.firebaseService.uploadToCloud(this.user.uid, payload);
    await this.commonService.dismissLoading();
    await this.commonService.presentToast('The upload was successful.');
    LocalStorageUtils.setStringItem(
      localStorConsts.lastCloudSync,
      new Date().toISOString(),
    );
  }

  async importHandler(clientsData, replaceStatus) {
    await this.commonService.presentLoading('Importing data...');

    if (clientsData?.userPreferences) {
      this.commonService.setUserPreferences(clientsData);
    }

    if (clientsData?.leases?.length) {
      await this.leaseService.restoreFromCloud(clientsData.leases);
    }

    if (clientsData?.clients?.length) {
      await this.dataBaseService.saveBulkClients(
        clientsData.clients,
        replaceStatus,
      );
    }

    await this.commonService.dismissLoading();
    setTimeout(() => {
      this.inputClientData = '';
      this.commonService.presentToast(
        'Data imported successfully. <br> Redirecting to the Clients List tab.',
      );
      this.router.navigate(['clients-list']);
    }, 1000);
  }

  exportData() {
    this.firebaseService.generateBackupResponse().then((backupData) => {
      if (this.fileType === 'json') {
        const clientDataString = JSON.stringify(backupData);
        this.writeSecretFile(clientDataString);
        this.nativeSaveByUrl(clientDataString);
      } else {
        this.excelExport(backupData.clients);
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
          `The file has been saved successfully in <br> Documents/${fileName}.`,
        );
      })
      .catch((err) => {
        const errString = 'No data found. <br>' + err.toString().slice(6);
        this.commonService.presentToast(
          errString,
          'failedToastClass',
          'alert-outline',
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
            'alert-outline',
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
          text: 'Sync with local',
          cssClass: 'bg-primary',
          handler: () => {
            this.importHandler(clientsData, false);
          },
        },
        {
          text: 'Replace All',
          cssClass: 'bg-primary',
          handler: () => {
            this.importHandler(clientsData, true);
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
        (client) => client.name === record.name,
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
          'Data imported successfully <br>Redirecting to Clients-list tab',
        );
        this.router.navigate(['clients-list']);
      }, 1000);
    });
  }

  get lastCloudSync(): string | null {
    return LocalStorageUtils.getStringItem(localStorConsts.lastCloudSync);
  }

  get lastDataModified(): string | null {
    return LocalStorageUtils.getStringItem(localStorConsts.lastDataModified);
  }

  get isBackupNeeded(): boolean {
    const sync = this.lastCloudSync;
    const modified = this.lastDataModified;
    if (!sync) return true;
    if (!modified) return false;
    return new Date(modified) > new Date(sync);
  }

  get lastBackupDate(): string | null {
    return this.firebaseService.getLastBackupDate();
  }

  get nextBackupDate(): Date | null {
    return this.firebaseService.getNextBackupDate();
  }

  onAutoBackupToggle() {
    this.saveAutoBackupSettings();
  }

  onBackupIntervalChange() {
    this.saveAutoBackupSettings();
  }

  private saveAutoBackupSettings() {
    const settings: AutoBackupSettings = {
      enabled: this.autoBackupEnabled,
      interval: +this.backupInterval,
    };
    this.firebaseService.saveAutoBackupSettings(settings);
    this.firebaseService.initializeAutoBackup();
  }
}
