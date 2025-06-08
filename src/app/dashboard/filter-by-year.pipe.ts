import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filterByYear',
  standalone: false // This pipe is not standalone, it should be declared in a module
})
export class FilterByYearPipe implements PipeTransform {
  transform(clientsArray, year): any {
    if (clientsArray && +year) {
      const yearInMonths = +year * 12;
      return clientsArray.filter(
        (client) => client.greaterTimePeriod <= yearInMonths
      );
    }
    return clientsArray;
  }
}
