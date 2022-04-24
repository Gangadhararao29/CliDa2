import { Injectable } from '@angular/core';
import LocalBase from 'localbase';
@Injectable({
  providedIn: 'root',
})
export class ClientDataService {
  db = new LocalBase('clida');
  today = new Date()
    .toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
    .split('/')
    .reverse()
    .join('-');

  constructor() {}

  async getAllClientsData() {
    return await this.db.collection('clientsData').get({ keys: true });
  }

  async getClientByKey(key) {
    return await this.db.collection('clientsData').doc(key).get();
  }

  async getRawClients() {
    return await this.db.collection('clientsData').get();
  }

  async addNewClient(newClient) {
    return await this.db.collection('clientsData').add(newClient);
  }

  async getClientByName(name) {
    return await this.db.collection('clientsData').doc({ name }).get();
  }

  async updateClientRecordByName(clientData) {
    return await this.db
      .collection('clientsData')
      .doc({ name: clientData.name })
      .update(clientData);
  }

  async saveBulkClients(clientsDataGroupString, replaceStatus) {
    const clientsDataGroup = JSON.parse(clientsDataGroupString);
    if (replaceStatus) {
      this.db
        .collection('clientsData')
        .delete()
        .then((res) => {
          clientsDataGroup.forEach(async (client) => {
            await this.addNewClient(client);
          });
        });
    } else {
      let responseObject = [];
      this.getRawClients().then((res) => {
        responseObject = res;
        responseObject.forEach((record) => {
          clientsDataGroup.forEach((client, index, clientsDataArray) => {
            if (record.name == client.name) {
              record.data.push(...client.data);
              clientsDataArray.splice(index, 1);
            }
          });
        });

        this.db
          .collection('clientsData')
          .delete()
          .then(() => {
            responseObject.forEach((client) => {
              this.addNewClient(client);
            });

            clientsDataGroup.forEach((client) => {
              this.addNewClient(client);
            });
          });
      });
    }
  }

  async deleteClient(id) {
    return await this.db.collection('clientsData').doc(id).delete();
  }

  async deleteDataBase() {
    return await this.db.delete();
  }

  /**
   * for calculating interests
   */

  calculateTimeperiod(startDate, endDate = this.today) {
    const d1 = new Date(startDate).getDate();
    const m1 = new Date(startDate).getMonth() + 1;
    const y1 = new Date(startDate).getFullYear();
    const d2 = new Date(endDate).getDate();
    const m2 = new Date(endDate).getMonth() + 1;
    const y2 = new Date(endDate).getFullYear();

    let d = d2 - d1;
    let m = m2 - m1;
    let y = y2 - y1;

    if (d < 0) {
      d += 30;
      m -= 1;
    }
    if (m < 0) {
      m += 12;
      y -= 1;
    }
    if (y < 0) {
      return { d: NaN, m: NaN, y: NaN, tm: NaN };
    } else {
      return { d, m, y, tm: 12 * y + m + d / 30 };
    }
  }

  calculateInterest(principal, rate, startDate, endDate = this.today) {
    let timeInMonths = this.calculateTimeperiod(startDate, endDate).tm;
    if (timeInMonths <= 36) {
      const interest = (principal * timeInMonths * rate) / 100.0;
      return { interest };
    } else {
      const interest = (principal * 36 * rate) / 100.0;
      timeInMonths = timeInMonths - 36;
      const newPrincipal = principal + interest;
      const newInterest = (newPrincipal * timeInMonths * rate) / 100.0;
      return { interest, newPrincipal, newInterest, timeInMonths };
    }
  }
}
