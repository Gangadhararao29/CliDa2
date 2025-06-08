import { Component, EventEmitter, Output, ViewChild } from '@angular/core';
import * as sampleData from '../../../assets/clientsData.json';
import { ClientDataService } from '../../services/client-data.service';

@Component({
  selector: 'app-intro',
  templateUrl: './intro.component.html',
  styleUrls: ['./intro.component.scss'],
  standalone: false,
})
export class IntroComponent {
  @ViewChild('creditDebitList') creditDebitList;
  @Output() reloadClientList = new EventEmitter();

  constructor(private clientDataService: ClientDataService) {}

  async loadSampleData() {
    const data = sampleData['default'];
    await this.clientDataService.loadSampleData(data).then(() => {
      this.reloadClientList.emit(true);
      setTimeout(() => {
        this.creditDebitList.nativeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      });
    });
  }
}
