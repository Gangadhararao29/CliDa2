import { Injectable } from '@angular/core';
import { LocalStorageUtils, localStorConsts } from '../shared/local-storage';

@Injectable({
  providedIn: 'root',
})
export class UtilsService {
  today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);

  constructor() {}

  private generatePayLoad(formData, includeClosedDetails) {
    return {
      name: this.formatToTitleCase(formData.userName),
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

  formatToTitleCase(name: string) {
    let name2 = name?.trim();
    return name2.replace(
      /(^\w|\s\w)(\S*)/g,
      (_, m1, m2) => m1.toUpperCase() + m2.toLowerCase(),
    );
  }

  replaceUndefinedWithNull(obj) {
    for (let key in obj) {
      if (obj.hasOwnProperty(key) && obj[key] === undefined) {
        obj[key] = null;
      }
    }
    return obj;
  }

  /**
   * Operation Log functions
   */
  addOperationLog(operation, oldData, newData, index = null) {
    this.markAsModified();
    const logData = LocalStorageUtils.getItem(localStorConsts.logs) || [];

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

      case 'bulk approve':
      case 'bulk delete':
      case 'bulk new':
        logData.push({
          operation,
          modifiedOn: this.today,
          bulkData: newData,
        });
        break;
    }

    LocalStorageUtils.setItem(localStorConsts.logs, logData);
  }

  private markAsModified() {
    LocalStorageUtils.setStringItem(localStorConsts.lastDataModified, new Date().toISOString());
  }

  formatLogDataForUI() {
    const rawLogData = LocalStorageUtils.getItem(localStorConsts.logs)
      ? LocalStorageUtils.getItem(localStorConsts.logs).reverse()
      : [];

    return rawLogData.map((log) => {
      switch (log.operation) {
        case 'new':
        case 'delete':
          return {
            operation: log.operation,
            name: log.data.name,
            interest: log.data.interest,
            startDate: log.data.startDate,
            principal: log.data.principal,
          };
        case 'edit':
        case 'edit - approve':
          return {
            operation: log.operation,
            name: log.orgData.name,
            interest: log.newData.interest,
            startDate: log.newData.startDate,
            principal: log.newData.principal,
          };

        case 'bulk approve':
        case 'bulk new':
        case 'bulk delete':
          return {
            operation: log.operation,
            name: log.bulkData.name,
            interest: log.bulkData.data[0].interest,
            startDate: log.bulkData.data[0].startDate,
            principal: log.bulkData.data.reduce(
              (acc, curr) => acc + curr.principal,
              0,
            ),
          };
      }
    });
  }
}
