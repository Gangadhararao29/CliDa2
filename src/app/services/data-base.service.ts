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
    return this.db.collection('clientsData').get({ keys: true });
  }

  async getAllClientsData() {
    return this.db.collection('clientsData').get();
  }

  async getClientByKey(key) {
    return this.db.collection('clientsData').doc(key).get();
  }

  async saveNewClient(newClient) {
    return this.db.collection('clientsData').add(newClient);
  }

  async updateClientByKey(key, clientData) {
    return this.db.collection('clientsData').doc(key).update(clientData);
  }

  async deleteClientByKey(id) {
    return this.db.collection('clientsData').doc(id).delete();
  }

  async deleteDataBase() {
    return this.db.delete();
  }

  async getClientByName(name) {
    return this.db.collection('clientsData').doc({ name }).get();
  }

  async updateClientRecordByName(clientData) {
    return this.db
      .collection('clientsData')
      .doc({ name: clientData.name })
      .update(clientData);
  }

  async bulkUpdateClientByKey(key, clientData, action) {
    switch (action) {
      case 'approve':
        const approvedRecords = clientData.data.filter((r) => r.bulkApproved);
        this.utilsService.addOperationLog('bulk approve', null, {
          name: clientData.name,
          data: approvedRecords,
        });
        break;

      case 'delete':
        const deletedRecords = clientData.data.filter((r) => r.bulkDeleted);
        this.utilsService.addOperationLog('bulk delete', null, {
          name: clientData.name,
          data: deletedRecords,
        });

        clientData.data = clientData.data.filter((r) => !r.bulkDeleted);
        if (clientData.data.length < 1) {
          return this.deleteClientByKey(key);
        }
        break;
    }
    clientData.lastModifiedOn = Date.now();
    return this.updateClientByKey(key, clientData);
  }

  async createDataRecords(payload) {
    payload.name = this.utilsService.formatToTitleCase(payload.name);

    if (payload.data.length == 1) {
      this.utilsService.addOperationLog('new', null, payload);
    } else {
      this.utilsService.addOperationLog('bulk new', null, payload);
    }

    const existingClient = await this.getClientByName(payload.name);

    if (existingClient) {
      existingClient.data.push(...payload.data);
      existingClient.lastModifiedOn = Date.now();
      return this.updateClientRecordByName(existingClient);
    } else {
      payload.lastModifiedOn = Date.now();
      return this.saveNewClient(payload);
    }
  }

  async handleRecordTransfer(payload, clientData) {
    const name = this.utilsService.formatToTitleCase(payload.name);
    const index = payload.index;
    const key = payload.key;
    const renameAllRecords = payload.renameAllRecords;
    delete payload.name;
    delete payload.index;
    delete payload.key;
    delete payload.renameAllRecords;

    clientData.data[index] = payload;

    const existingClient = await this.getClientByName(name);
    if (existingClient) {
      existingClient.lastModifiedOn = Date.now();
      if (renameAllRecords) {
        existingClient.data.push(...clientData.data);
        await this.updateClientRecordByName(existingClient);
        return this.deleteClientByKey(key);
      } else {
        existingClient.data.push(payload);
        await this.updateClientRecordByName(existingClient);
        return this.deleteClientData(clientData, index, key);
      }
    } else {
      if (renameAllRecords) {
        clientData.name = name;
        clientData.lastModifiedOn = Date.now();
        return this.updateClientByKey(key, clientData);
      } else {
        const createPayload = {
          name: name,
          data: [payload],
        };
        await this.createDataRecords(createPayload);
        return this.deleteClientData(clientData, index, key);
      }
    }
  }

  async saveClientRecord(payload, clientData) {
    const name = this.utilsService.formatToTitleCase(payload.name);
    const index = payload.index;
    const key = payload.key;
    delete payload.name;
    delete payload.index;
    delete payload.key;

    this.utilsService.addOperationLog('edit', clientData, payload, index);

    clientData.name = name;
    clientData.lastModifiedOn = Date.now();
    clientData.data[index] = payload;
    return this.updateClientByKey(key, clientData);
  }

  async approveClientData(newData, oldData, index) {
    newData.lastModifiedOn = Date.now();
    return this.updateClientRecordByName(newData).then(() => {
      this.utilsService.addOperationLog(
        'edit - approve',
        { name: newData.name, ...oldData },
        newData.data[index],
      );
    });
  }

  async deleteClientData(clientData, index, key) {
    this.utilsService.addOperationLog('delete', clientData, [], index);
    clientData.data.splice(index, 1);
    if (clientData.data.length < 1) {
      return this.deleteClientByKey(key);
    } else {
      clientData.lastModifiedOn = Date.now();
      return this.updateClientRecordByName(clientData);
    }
  }

  async saveBulkClients(clientsData, replaceStatus) {
    if (replaceStatus) {
      return this.db.collection('clientsData').set(clientsData);
    } else {
      const promises = clientsData.map(async (client) => {
        const res = await this.getClientByName(client.name);

        if (res) {
          if (!client.lastModifiedOn || !res.lastModifiedOn) {
            return this.updateClientRecordByName(res);
          } else {
            if (res.lastModifiedOn > client.lastModifiedOn) {
              return this.updateClientRecordByName(res);
            }
          }
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
                record?.principal && record?.interest && record?.startDate,
            )
            .map((record) =>
              this.utilsService.replaceUndefinedWithNull(record),
            ),
          lastModifiedOn: client.lastModifiedOn || Date.now(),
        }))
        .filter((client) => client?.name && client.data?.length);

      await this.db.collection('clientsData').set(clients);
    } catch (error) {
      console.error('Error cleaning clients data:', error);
    }
  }

  async loadSampleData(data) {
    return this.db.collection('clientsData').set(data);
  }

  async cleanApprovedData() {
    return this.getAllClientsData().then((res) => {
      res = res.filter((client) => {
        client.data = client.data?.filter((record) => !record?.closedOn);
        return client?.name && client.data?.length;
      });
      this.db.collection('clientsData').set(res);
    });
  }
}
