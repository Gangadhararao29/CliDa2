import { Component, Input, OnInit } from '@angular/core';
import { ClientDataService } from '../../services/client-data.service';

@Component({
  selector: 'app-datalist',
  templateUrl: './datalist.component.html',
  styleUrls: ['./datalist.component.scss'],
})
export class DatalistComponent implements OnInit {
  @Input() dataList: any[] = [];
  @Input() clientSearchValue: string = '';

  constructor(private clientDataService: ClientDataService) {}

  ngOnInit() {}

  getColor(detail) {
    const tm = this.clientDataService.calculateTimeperiod(detail?.startDate).tm;
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
