import { Component, OnInit, Input } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { Capacitor } from '@capacitor/core';
import { FirebaseService, AutoBackupSettings } from '../../services/firebase.service';
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

  loadingData = true;
  user: any = null;
  isWebVersion: boolean = false;
  autoBackupEnabled: boolean = false;
  backupInterval: string = '1';
  cloudSyncType: string = 'soft';

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
      this.commonService.presentToast(
        'Data imported successfully. <br> Redirecting to the Clients List tab.',
      );
      this.router.navigate(['clients-list']);
    }, 1000);
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
