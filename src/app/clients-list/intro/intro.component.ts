import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import * as sampleData from '../../../assets/clientsData.json';
import { DataBaseService } from '../../services/data-base.service';

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

  constructor(private dataBaseService: DataBaseService) {}

  async loadSampleData() {
    const data = sampleData['default'];
    await this.dataBaseService.loadSampleData(data).then(() => {
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
