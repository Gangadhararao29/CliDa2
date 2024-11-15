import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-calc-history',
  templateUrl: './calc-history.component.html',
  styleUrls: ['./calc-history.component.scss'],
})
export class CalcHistoryComponent {
  @Input() showModal = false;
  @Input() calHistory: Array<{ key: string; value: Array<any> }>;
  @Output() restoreData = new EventEmitter<string>();

  loadData(ele, id) {
    const index = this.calHistory[ele].value.findIndex((calc) => calc.id == id);
    const record = this.calHistory[ele][index];
    record.name = record.name || 'Calc' + index;
    this.restoreData.emit(record);
    this.showModal = false;
  }

  openModal() {
    this.showModal = true;
  }

  closeModal(event?) {
    if (event) {
      event.stopPropagation();
    }
    this.showModal = false;
  }

  currFor(value) {
    const formattedValue = new Intl.NumberFormat('en-IN').format(
      Math.round(value * 100) / 100
    );
    return `₹ ${formattedValue}`;
  }

  isFirstRecord(index: number): boolean {
    return index === 0;
  }
}
