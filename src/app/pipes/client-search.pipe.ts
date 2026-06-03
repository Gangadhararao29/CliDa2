import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'clientsSearch',
  standalone: false, // This pipe is not standalone, it should be declared in a module
})
export class ClientsSearchPipe implements PipeTransform {
  transform(clientsArray, searchText) {
    if (!clientsArray || !searchText) {
      return clientsArray;
    }

    const searchValue = String(searchText).trim();
    const searchLower = searchValue.toLowerCase();

    return clientsArray.filter((client) => {
      // Always search in name (fuzzy match)
      if (
        client.data.name &&
        client.data.name.toLowerCase().includes(searchLower)
      ) {
        return true;
      }

      const searchNum = parseFloat(searchValue);

      if (!isNaN(searchNum)) {
        return client.data.data.some((record) => {
          try {
            if (searchNum >= 2000 && searchNum <= 3000) {
              const startYear = new Date(record.startDate).getFullYear();
              if (String(startYear).includes(searchValue)) {
                return true;
              }
            }

            if (record.principal == searchNum || record.interest == searchNum) {
              return true;
            }
          } catch (e) {}
        });
      }

      return false;
    });
  }
}
