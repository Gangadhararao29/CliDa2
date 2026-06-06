import { Injectable } from '@angular/core';
import {
  Auth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  User,
} from '@angular/fire/auth';
import { onAuthStateChanged } from 'firebase/auth';
import {
  Firestore,
  doc,
  getDoc,
  writeBatch,
  deleteField,
} from '@angular/fire/firestore';
import { DataBaseService } from './data-base.service';
import { localStorConsts, LocalStorageUtils } from '../shared/local-storage';
import { CommonService } from './common.service';
import { LeaseService } from './lease.service';

export interface AutoBackupSettings {
  enabled: boolean;
  interval: number;
}

@Injectable({
  providedIn: 'root',
})
export class FirebaseService {
  private currentUser: User | null = null;

  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private dataBaseService: DataBaseService,
    private commonService: CommonService,
    private leaseService: LeaseService,
  ) {}

  onAuthStateChanged(callback: (user: User | null) => void) {
    return onAuthStateChanged(this.auth, callback);
  }

  async signInWithGoogle(): Promise<User | null> {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(this.auth, provider);
    return result.user;
  }

  async signOutUser(): Promise<void> {
    await signOut(this.auth);
  }

  async loadCloudData(uid: string): Promise<any> {
    const db = this.firestore;

    //profile section
    const profileRef = doc(db, uid, 'profile');
    const profileSnap = await getDoc(profileRef);

    let userPreferences = {};
    let logs = [];
    let calcLogs = [];

    if (profileSnap.exists()) {
      const data = profileSnap.data();
      userPreferences = data['userPreferences'];
      logs = data['logs'];
      calcLogs = data['calcLogs'];
    }

    //clients section
    const clientsRef = doc(db, uid, 'clients');
    const clientsSnap = await getDoc(clientsRef);

    let clients: any[] = [];

    if (clientsSnap.exists()) {
      const data = clientsSnap.data();

      // convert object map → array
      clients = Object.values(data);
    }

    //leases section
    const leasesRef = doc(db, uid, 'leases');
    const leasesSnap = await getDoc(leasesRef);

    let leases: any[] = [];

    if (leasesSnap.exists()) {
      const data = leasesSnap.data();
      leases = Object.values(data);
    }

    return {
      clients,
      leases,
      userPreferences,
      logs,
      calcLogs,
    };
  }

  async uploadToCloud(uid: string, payload: any): Promise<void> {
    const db = this.firestore;
    const batch = writeBatch(db);

    //profile section
    const profileRef = doc(db, uid, 'profile');

    batch.set(
      profileRef,
      {
        userPreferences: payload.userPreferences,
        logs: payload.logs,
        calcLogs: payload.calcLogs,
      },
      { merge: true },
    );

    //clients section
    if (payload.updatedClients || payload.removedClients) {
      const clientsRef = doc(db, uid, 'clients');
      const clientUpdates: any = {};

      // updated clients
      payload.updatedClients.forEach((client) => {
        const clientId = client.name;
        clientUpdates[clientId] = client;
      });

      // removed clients
      payload.removedClients.forEach((client) => {
        const clientId = client.name;
        clientUpdates[clientId] = deleteField();
      });

      batch.set(clientsRef, clientUpdates, { merge: true });
    }

    //leases section
    if (payload.updatedLeases || payload.removedLeases) {
      const leasesRef = doc(db, uid, 'leases');
      const leaseUpdates: any = {};

      payload.updatedLeases.forEach((lease) => {
        const leaseId = lease.id.toString();
        leaseUpdates[leaseId] = lease;
      });

      payload.removedLeases.forEach((lease) => {
        const leaseId = lease.id.toString();
        leaseUpdates[leaseId] = deleteField();
      });

      batch.set(leasesRef, leaseUpdates, { merge: true });
    }

    await batch.commit();
  }

  async generateBackupResponse() {
    const clients = await this.dataBaseService.getAllClientsData();
    const settings = this.commonService.getUserPreferences();
    const leases = await this.leaseService.getLeaseClients();
    const backupData = {
      clients,
      leases,
      ...settings,
    };

    return backupData;
  }

  // Auto Backup Logic
  getAutoBackupSettings(): AutoBackupSettings {
    try {
      const raw = LocalStorageUtils.getStringItem(
        localStorConsts.autoBackupSettings,
      );
      if (raw) return JSON.parse(raw);
    } catch {}
    return { enabled: false, interval: 1 };
  }

  saveAutoBackupSettings(settings: AutoBackupSettings): void {
    LocalStorageUtils.setStringItem(
      localStorConsts.autoBackupSettings,
      JSON.stringify(settings),
    );
  }

  getLastBackupDate(): string | null {
    return LocalStorageUtils.getStringItem(localStorConsts.lastAutoBackup);
  }

  getNextBackupDate(): Date | null {
    const settings = this.getAutoBackupSettings();
    if (!settings.enabled) return null;
    const last = this.getLastBackupDate();
    const base = last ? new Date(last) : new Date();
    return this.addInterval(base, settings.interval);
  }

  private addInterval(date: Date, interval: number): Date {
    const d = new Date(date);
    if (interval === 30) {
      d.setMonth(d.getMonth() + 1);
    } else {
      d.setDate(d.getDate() + interval);
    }
    return d;
  }

  initializeAutoBackup(): void {
    console.log('[FirebaseService] Initializing auto backup...');
    onAuthStateChanged(this.auth, (user) => {
      this.currentUser = user;
      if (!user) return;

      const settings = this.getAutoBackupSettings();
      if (!settings.enabled) return;

      const lastBackupDate = this.getLastBackupDate();
      const nextBackupDate = this.getNextBackupDate();
      if (new Date() > nextBackupDate || !lastBackupDate) {
        console.log('[FirebaseService] Running auto backup...');
        this.runAutoBackup();
      }
    });
  }

  private async runAutoBackup(): Promise<void> {
    try {
      const payload = await this.getModifiedData(true, this.currentUser.uid);
      if (
        payload.updatedClients.length == 0 &&
        payload.updatedLeases.length == 0
      ) {
        console.log('[FirebaseService] No updates found');
        LocalStorageUtils.setStringItem(
          localStorConsts.lastAutoBackup,
          new Date().toISOString(),
        );
        return;
      }
      await this.uploadToCloud(this.currentUser.uid, payload);
      LocalStorageUtils.setStringItem(
        localStorConsts.lastAutoBackup,
        new Date().toISOString(),
      );
      console.log('[FirebaseService] Auto backup completed successfully');
    } catch (err) {
      console.error('[FirebaseService] Auto backup failed:', err);
    }
  }

  async getModifiedData(isSoftBackup: boolean, uid: string) {
    const payload: any = await this.generateBackupResponse();
    const localClients = payload.clients;
    const cloudData = await this.loadCloudData(uid);
    const onlineClients = cloudData.clients;
    const onlineLeases = cloudData.leases;

    payload.updatedClients = [];
    payload.removedClients = [];

    payload.updatedClients.push(
      ...localClients.filter((client) => {
        const onlineClient = onlineClients.find((c) => c.name === client.name);
        if (!onlineClient) return true;

        if (!client.lastModifiedOn || !onlineClient.lastModifiedOn) return true;

        return client.lastModifiedOn > onlineClient.lastModifiedOn;
      }),
    );

    payload.updatedLeases = [];
    payload.removedLeases = [];

    payload.updatedLeases.push(
      ...payload.leases.filter((lease) => {
        const onlineLease = onlineLeases.find((l) => l.id == lease.id);
        if (!onlineLease) return true;

        if (
          lease.lastPaidYear == onlineLease.lastPaidYear &&
          lease.endDate == onlineLease.endDate
        )
          return false;

        return true;
      }),
    );

    if (!isSoftBackup) {
      payload.removedClients.push(
        ...onlineClients.filter((onlineClient) => {
          const localClient = localClients.find(
            (c) => c.name === onlineClient.name,
          );
          if (!localClient) return true;
          return false;
        }),
      );

      payload.removedLeases.push(
        ...onlineLeases.filter((onlineLease) => {
          const localLease = payload.leases.find((l) => l.id == onlineLease.id);
          if (!localLease) return true;
          return false;
        }),
      );
    }

    return payload;
  }
}
