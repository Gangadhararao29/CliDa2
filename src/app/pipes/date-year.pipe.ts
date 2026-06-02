import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'dateYear',
  standalone: false,
})
export class DateYearPipe implements PipeTransform {
  transform(value: string | Date): number {
    if (!value) return null;
    if (typeof value === 'string' && value.includes('-')) {
      const parts = value.split('-');
      if (parts.length >= 1) {
        const year = parseInt(parts[0], 10);
        if (!isNaN(year) && year > 1900 && year < 2100) return year;
      }
    }
    return new Date(value).getFullYear();
  }
}
