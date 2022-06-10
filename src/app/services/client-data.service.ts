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

  constructor() {
    this.db.config.debug = false;
  }

  async getAllClientsDataWithKeys() {
    return await this.db.collection('clientsData').get({ keys: true });
  }

  async getAllClientsData() {
    return await this.db.collection('clientsData').get();
  }

  async getClientByName(name) {
    return await this.db.collection('clientsData').doc({ name }).get();
  }

  async getClientByKey(key) {
    return await this.db.collection('clientsData').doc(key).get();
  }

  async saveNewClient(newClient) {
    return await this.db.collection('clientsData').add(newClient);
  }

  async deleteClientByKey(id) {
    return await this.db.collection('clientsData').doc({ id }).delete();
  }

  async deleteDataBase() {
    return await this.db.delete();
  }

  async updateClientRecordByName(clientData) {
    return await this.db
      .collection('clientsData')
      .doc({ name: clientData.name })
      .update(clientData);
  }

  async addNewClientData(formData, recordType, includeClosedDetails = false) {
    const payLoad = this.generatePayLoad(
      formData,
      recordType,
      includeClosedDetails
    );
    return await this.getClientByName(payLoad.name).then((res) => {
      if (res) {
        res.data.push(payLoad.data[0]);
        return this.updateClientRecordByName(res);
      } else {
        return this.saveNewClient(payLoad);
      }
    });
  }

  async editClientData(formData, recordType, clientData, index) {
    formData.userName = this.formatToCamelCase(formData.userName);
    formData.principal =
      recordType === 'credit'
        ? Math.abs(formData.principal)
        : -Math.abs(formData.principal);
    if (formData.userName == clientData.name) {
      delete formData.userName;
      formData.id = clientData.data[index].id;
      clientData.data[index] = formData;
      return await this.updateClientRecordByName(clientData);
    } else {
      return await this.addNewClientData(formData, recordType, true);
    }
  }

  async deleteClientData(clientData, index, key) {
    if (clientData.length <= 1) {
      return this.deleteClientByKey(key);
    } else {
      clientData.data.splice(index, 1);
      return this.updateClientRecordByName(clientData);
    }
  }

  async saveBulkClients(clientsDataGroupString, replaceStatus) {
    const clientsDataGroup = JSON.parse(clientsDataGroupString);
    if (replaceStatus) {
      return await this.db.collection('clientsData').set(clientsDataGroup);
    } else {
      clientsDataGroup.forEach((client) => {
        this.getClientByName(client.name).then((res) => {
          if (res) {
            const recordExisted = res.data.filter(
              (clientData) => clientData.id === res.id
            );
            if (!recordExisted) {
              res.push(client.data);
              this.updateClientRecordByName(res);
            }
          } else {
            this.saveNewClient(client);
          }
        });
      });
    }
  }

  /**
   * for calculating interests
   */

  calculateTimeperiod(startDate, endDate = this.today) {
    const sd = new Date(startDate);
    const ed = new Date(endDate);
    const d1 = sd.getDate();
    const m1 = sd.getMonth() + 1;
    const y1 = sd.getFullYear();
    const d2 = ed.getDate();
    const m2 = ed.getMonth() + 1;
    const y2 = ed.getFullYear();

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

  /**
   * utilities here
   */

  generatePayLoad(formData, recordType, includeClosedDetails) {
    return {
      name: this.formatToCamelCase(formData.userName),
      data: [
        {
          id: Date.now(),
          principal:
            recordType === 'credit' ? formData.principal : -formData.principal,
          interest: formData.interest,
          startDate: formData.startDate,
          comments: formData.comments,
          closedOn: includeClosedDetails ? formData.closedOn : null,
          closedAmount: includeClosedDetails ? formData.closedAmount : null,
        },
      ],
    };
  }

  formatToCamelCase(name: string) {
    return name.replace(
      /(^\w|\s\w)(\S*)/g,
      (_, m1, m2) => m1.toUpperCase() + m2.toLowerCase()
    );
  }

  async orderByName(orderKey) {
    if (orderKey === 'asc') {
      return await this.db
        .collection('clientsData')
        .orderBy('name')
        .get({ keys: true });
    } else {
      return await this.db
        .collection('clientsData')
        .orderBy('name', 'desc')
        .get({ keys: true });
    }
  }
}
