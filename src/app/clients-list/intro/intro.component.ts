import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import * as sampleData from '../../../assets/clientsData.json';
import { DataBaseService } from '../../services/data-base.service';
import { LeaseService } from '../../services/lease.service';
import { LocalStorageUtils, localStorConsts } from '../../shared/local-storage';

@Component({
  selector: 'app-intro',
  templateUrl: './intro.component.html',
  styleUrls: ['./intro.component.scss'],
  standalone: false,
})
export class IntroComponent {
  @ViewChild('creditDebitList') creditDebitList;
  @Output() reloadClientList = new EventEmitter();
  @Input() theme: string;

  constructor(
    private dataBaseService: DataBaseService,
    private leaseService: LeaseService,
  ) {}

  async loadSampleData() {
    const data = sampleData['default'];
    await this.dataBaseService.loadSampleData(data.clients);
    await this.leaseService.restoreFromCloud(data.leases);
    LocalStorageUtils.setItem(localStorConsts.logs, data.logs || []);
    this.reloadClientList.emit(true);
    setTimeout(() => {
      this.creditDebitList.nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    });
  }
}
