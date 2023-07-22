import { Injectable } from '@angular/core';
import { LoadingController, ToastController } from '@ionic/angular';
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

  constructor(
    private toastController: ToastController,
    private loadingController: LoadingController
  ) {
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
    return await this.db.collection('clientsData').doc(id).delete();
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

  async addNewClientData(formData, includeClosedDetails = false) {
    const payLoad = this.generatePayLoad(formData, includeClosedDetails);
    this.addNewLogData('new', null, payLoad);
    return await this.getClientByName(payLoad.name).then((res) => {
      if (res) {
        res.data.push(payLoad.data[0]);
        return this.updateClientRecordByName(res);
      } else {
        return this.saveNewClient(payLoad);
      }
    });
  }

  async editClientData(formData, clientData, index) {
    formData.userName = this.formatToCamelCase(formData.userName);
    formData.principal =
      formData.recordType === 'credit'
        ? Math.abs(formData.principal)
        : -Math.abs(formData.principal);

    this.addNewLogData('edit', clientData, formData, index);
    if (formData.userName == clientData.name) {
      delete formData.userName;
      formData.id = clientData.data[index].id;
      clientData.data[index] = formData;
      return await this.updateClientRecordByName(clientData);
    } else {
      return await this.addNewClientData(formData, true);
    }
  }

  async deleteClientData(clientData, index, key) {
    this.addNewLogData('delete', clientData, [], index);
    clientData.data.splice(index, 1);
    if (clientData.data.length < 1) {
      return this.deleteClientByKey(key);
    } else {
      return this.updateClientRecordByName(clientData);
    }
  }

  async saveBulkClients(clientsData, replaceStatus) {
    if (replaceStatus) {
      return await this.db.collection('clientsData').set(clientsData);
    } else {
      const promises = clientsData.map(async (client) => {
        const res = await this.getClientByName(client.name);
        if (res) {
          const recordIndex = res.data.findIndex(
            (clientData) => clientData.id === res.id
          );
          if (recordIndex > -1) {
            res.push(client.data);
          } else {
            res.data[recordIndex] = client.data;
          }
          return this.updateClientRecordByName(res);
        } else {
          return this.saveNewClient(client);
        }
      });

      return Promise.all(promises);
    }
  }

  async cleanClientsData() {
    return await this.getAllClientsData().then((res) => {
      res = res.filter((client) => {
        client.data = client.data?.filter(
          (record) => record?.principal && record?.interest && record?.startDate
        );
        return client?.name && client.data?.length;
      });
      this.db.collection('clientsData').set(res);
    });
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

  calculateTotalInterest(data, endDate = this.today, ci = 3) {
    let tm = this.calculateTimeperiod(data.startDate, endDate).tm;
    let start = 0;
    const resultArray = [];
    while (tm > ci * 12) {
      tm -= ci * 12;
      const intAmt = data.principal * data.rate * 0.12 * ci;
      resultArray.push({
        start,
        end: start + ci,
        principal: data.principal,
        intAmt,
      });
      data.principal += intAmt;
      start += ci;
    }
    const remInt = (data.principal * data.rate * tm) / 100.0;
    resultArray.push({
      start,
      end: (start + tm / 12.0).toFixed(2),
      principal: data.principal,
      intAmt: remInt,
    });
    return resultArray;
  }

  /**
   * utilities here
   */
  generatePayLoad(formData, includeClosedDetails) {
    return {
      name: this.formatToCamelCase(formData.userName),
      data: [
        {
          id: Date.now(),
          principal:
            formData.recordType === 'credit'
              ? Math.abs(formData.principal)
              : -Math.abs(formData.principal),
          interest: formData.interest,
          startDate: formData.startDate,
          comments: formData.comments,
          closedOn: includeClosedDetails ? formData.closedOn || null : null,
          closedAmount: includeClosedDetails
            ? formData.closedAmount || null
            : null,
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

  async presentToast(
    message,
    cssClass = 'successToastClass',
    icon = 'checkmark-outline'
  ) {
    const toast = await this.toastController.create({
      message,
      position: 'top',
      duration: 2800,
      animated: true,
      cssClass,
      icon,
    });
    toast.present();
  }

  async presentLoading() {
    const loading = await this.loadingController.create({
      animated: true,
      message: 'Loading...',
      duration: 1000,
      spinner: 'lines',
    });
    await loading.present();
  }

  /**
   * Operation Log functions
   */
  addNewLogData(operation, oldData, newData, index = null) {
    const logData = JSON.parse(localStorage.getItem('logs') || '[]');

    switch (operation) {
      case 'new':
        logData.push({
          operation,
          modifiedOn: this.today,
          data: { name: newData.name, ...newData.data[0] },
        });
        break;

      case 'edit':
        logData.push({
          operation,
          modifiedOn: this.today,
          orgData: { name: oldData.name, ...oldData.data[index] },
          newData,
        });
        break;

      case 'delete':
        logData.push({
          operation,
          modifiedOn: this.today,
          data: { name: oldData.name, ...oldData.data[0] },
        });
        break;

      case 'edit - approve':
        logData.push({
          operation,
          modifiedOn: this.today,
          orgData: oldData,
          newData,
        });
        break;
    }

    localStorage.setItem('logs', JSON.stringify(logData));
  }

  async loadSampleData(data) {
    await this.db.collection('clientsData').set(data);
  }

  getTheme() {
    let theme = localStorage.getItem('theme');
    const preferColorMode = window.matchMedia('(prefers-color-scheme:dark)');
    if (theme == null || theme == 'auto') {
      theme = preferColorMode.matches ? 'dark' : 'light';
    }
    return theme;
  }
}
