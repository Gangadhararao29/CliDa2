import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-calc-history',
  templateUrl: './calc-history.component.html',
  styleUrls: ['./calc-history.component.scss'],
  standalone: false,
})
export class CalcHistoryComponent {
  @Input() showModal = false;
  @Input() calHistory: Array<{ key: string; value: Array<any> }>;
  @Output() restoreData = new EventEmitter<string>();

  loadData(key, id) {
    const calcObject = this.calHistory.find((ele) => ele.key == key);
    const index = calcObject.value.findIndex((calc) => calc.id == id);
    const calcRecord = calcObject.value[index];
    calcRecord.name =
      calcRecord.name || 'Calc' + (calcObject.value.length - index);
    this.restoreData.emit(calcRecord);
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
