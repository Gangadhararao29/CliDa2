import { Injectable } from '@angular/core';
import LocalBase from 'localbase';

const LEASE_DB_NAME = 'leaseDB';
const LEASE_COLLECTION = 'leaseClients';

@Injectable({
  providedIn: 'root',
})
export class LeaseService {
  private db = new LocalBase(LEASE_DB_NAME);

  constructor() {
    this.db.config.debug = false;
  }

  async getLeaseClients() {
    try {
      return await this.db.collection(LEASE_COLLECTION).get();
    } catch (e) {
      console.error('Error getting lease clients:', e);
      return [];
    }
  }

  async saveLeaseClients(client) {
    try {
      const existing = await this.db
        .collection(LEASE_COLLECTION)
        .doc({ id: client.id })
        .get();
      if (existing) {
        await this.db
          .collection(LEASE_COLLECTION)
          .doc({ id: client.id })
          .update(client);
      } else {
        await this.db.collection(LEASE_COLLECTION).add(client);
      }
    } catch (e) {
      console.error('Error saving lease client:', e);
    }
  }

  async deleteLeaseClient(id: number) {
    try {
      await this.db.collection(LEASE_COLLECTION).doc({ id }).delete();
    } catch (e) {
      console.error('Error deleting lease client:', e);
    }
  }

  async deleteDataBase() {
    return this.db.delete();
  }

  async upLoadToCloud() {
    const clients = await this.getLeaseClients();

    if (clients.length === 0) return;

    const payload = {
      name: 'LEASE_CLIENTS',
      data: clients,
    };

    return payload;
  }

  async restoreFromCloud(cloudData: Array<any>) {
    if (cloudData?.length == 0) return;
    cloudData.forEach(async (record) => {
      await this.saveLeaseClients(record);
    });
  }
}
