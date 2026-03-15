import { Injectable } from '@angular/core';

const LEASE_KEY = 'leaseClients';

@Injectable({
  providedIn: 'root',
})
export class LeaseService {
  constructor() {}

  getLeaseClients() {
    let lcString = localStorage.getItem(LEASE_KEY);
    if (!lcString) {
      return [];
    }

    try {
      return JSON.parse(lcString);
    } catch (e) {
      console.error(`Error parsing : ${lcString}`, e);
      return [];
    }
  }

  saveLeaseClients(client) {
    let existingClients = this.getLeaseClients();
    const index = existingClients.findIndex((x) => x.id === client.id);
    if (index > -1) {
      existingClients[index] = client;
    } else {
      existingClients.push(client);
    }
    localStorage.setItem(LEASE_KEY, JSON.stringify(existingClients));
  }

  deleteLeaseClient(id: number) {
    let existingClients = this.getLeaseClients();
    const index = existingClients.findIndex((x) => x.id === id);
    if (index > -1) {
      existingClients.splice(index, 1);
    }
    localStorage.setItem(LEASE_KEY, JSON.stringify(existingClients));
  }
}
