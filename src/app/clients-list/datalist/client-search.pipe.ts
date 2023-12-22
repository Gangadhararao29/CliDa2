import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'clientsSearch',
})
export class ClientsSearchPipe implements PipeTransform {
  transform(clientsArray, searchText) {
    if (!clientsArray || !searchText) {
      return clientsArray;
    }
    return clientsArray.filter((client) =>
      client.data.name.toLowerCase().includes(searchText.toLowerCase())
    );
  }
}
