import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class UtilsService {
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

  generatePayLoad(formData, includeClosedDetails) {
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
    return name.replace(
      /(^\w|\s\w)(\S*)/g,
      (_, m1, m2) => m1.toUpperCase() + m2.toLowerCase()
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
}
