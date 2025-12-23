import { Injectable } from '@angular/core';
import LocalBase from 'localbase';
import { UtilsService } from './utils.service';

@Injectable({
  providedIn: 'root',
})
export class DataBaseService {
  db = new LocalBase('clida');

  constructor(private utilsService: UtilsService) {
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
    const payLoad = this.utilsService.generatePayLoad(
      formData,
      includeClosedDetails
    );
    this.utilsService.addNewLogData('new', null, payLoad);
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
    formData.userName = this.utilsService.formatToCamelCase(formData.userName);
    formData.principal =
      formData.recordType === 'credit'
        ? Math.abs(formData.principal)
        : -Math.abs(formData.principal);

    this.utilsService.addNewLogData('edit', clientData, formData, index);
    if (formData.userName == clientData.name) {
      delete formData.userName;
      formData.id = clientData.data[index].id;
      clientData.data[index] = formData;
      return await this.updateClientRecordByName(clientData);
    } else {
      return await this.addNewClientData(formData, true);
    }
  }

  async approveClientData(newData, oldData, index) {
    return await this.updateClientRecordByName(newData).then(() => {
      this.utilsService.addNewLogData(
        'edit - approve',
        { name: newData.name, ...oldData },
        newData.data[index]
      );
    });
  }

  async deleteClientData(clientData, index, key) {
    this.utilsService.addNewLogData('delete', clientData, [], index);
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
    try {
      let clients = await this.getAllClientsData();

      clients = clients
        .map((client) => ({
          ...client,
          data: client.data
            .filter(
              (record) =>
                record?.principal && record?.interest && record?.startDate
            )
            .map((record) =>
              this.utilsService.replaceUndefinedWithNull(record)
            ),
        }))
        .filter((client) => client?.name && client.data?.length);

      await this.db.collection('clientsData').set(clients);
    } catch (error) {
      console.error('Error cleaning clients data:', error);
    }
  }

  async loadSampleData(data) {
    await this.db.collection('clientsData').set(data);
  }

  async cleanApprovedData() {
    return await this.getAllClientsData().then((res) => {
      res = res.filter((client) => {
        client.data = client.data?.filter((record) => !record?.closedOn);
        return client?.name && client.data?.length;
      });
      this.db.collection('clientsData').set(res);
    });
  }
}
