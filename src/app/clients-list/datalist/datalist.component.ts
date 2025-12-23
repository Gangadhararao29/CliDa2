import { Component, Input } from '@angular/core';
import { CalculationService } from '../../services/calculation.service';

@Component({
  selector: 'app-datalist',
  templateUrl: './datalist.component.html',
  styleUrls: ['./datalist.component.scss'],
  standalone: false,
})
export class DatalistComponent {
  @Input() dataList: any[] = [];
  @Input() clientSearchValue: string = '';

  constructor(private calculationService: CalculationService) {}

  getColor(detail) {
    const tm = this.calculationService.calculateTimeperiod(
      detail?.startDate
    ).tm;
    if (detail?.closedOn) {
      return 'success';
    } else if (tm >= 30) {
      return 'danger';
    } else if (tm >= 24) {
      return 'warning';
    } else if (tm >= 12) {
      return 'primary';
    } else {
      return 'medium';
    }
  }

  trackData(index, client) {
    return client.key;
  }
}
