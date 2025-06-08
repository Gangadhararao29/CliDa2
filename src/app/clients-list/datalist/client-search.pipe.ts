import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'clientsSearch',
  standalone: false // This pipe is not standalone, it should be declared in a module
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
