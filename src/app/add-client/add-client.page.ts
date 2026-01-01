import { Component, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DataBaseService } from '../services/data-base.service';
import { CommonService } from '../services/common.service';
import { PresetService } from '../services/preset.service';

@Component({
  selector: 'app-add-client',
  templateUrl: './add-client.page.html',
  styleUrls: ['./add-client.page.scss'],
  standalone: false,
})
export class AddClientPage {
  @ViewChild('formRef') formRefVariable: any;
  isAddBtnDisable: boolean;
  clientsData = [];
  today: any;
  theme: string;
  presets = [];

  transactions: Array<{
    principal: number | null;
    interest: number | null;
    startDate: string;
  }> = [];

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private dataBaseService: DataBaseService,
    private commonService: CommonService,
    private presetService: PresetService
  ) {}

  ionViewWillEnter() {
    this.theme = this.commonService.getTheme();
    this.presets = this.presetService.getPresets();
    this.isAddBtnDisable = false;

    this.dataBaseService.getAllClientsData().then((res) => {
      this.clientsData = res;
    });

    this.formRefVariable.form.patchValue({
      userName: this.activatedRoute.snapshot.queryParamMap.get('name'),
      recordType: 'credit',
    });

    // Initialize with one transaction
    if (this.transactions.length == 0) {
      this.transactions = [
        {
          principal: null,
          interest: null,
          startDate: this.commonService.today,
        },
      ];
    }
  }

  getCommentHeight(event) {
    event.target.style.height = 0;
    event.target.style.height = `${event.target.scrollHeight}px`;
  }

  getUserNameFeedback(userName) {
    const name: string = userName.control.value;

    if (name) {
      const existingClient = this.clientsData.find(
        (x) => x.name.toLowerCase() == name.toLowerCase()
      );
      if (existingClient) {
        return 'Client already exists. This record will be added.';
      }
    }

    return 'A new client will be created using the entered name.';
  }

  addTransaction() {
    this.transactions.push({
      principal: null,
      interest: null,
      startDate: this.commonService.today,
    });
  }

  removeTransaction(index: number) {
    if (this.transactions.length > 1) {
      this.transactions.splice(index, 1);
    }
  }

  generatePayLoad(record) {
    const sign = record.recordType === 'credit' ? 1 : -1;
    return {
      name: record.userName,
      data: this.transactions.map((t, index) => ({
        id: Date.now() + index,
        principal: sign * Math.abs(t.principal),
        interest: t.interest,
        startDate: t.startDate,
        comments: record.comments,
      })),
    };
  }

  async onSubmit(formRef) {
    if (!formRef.valid) {
      this.commonService.presentToast(
        'Please fill all the fields',
        'failedToastClass',
        'alert-circle'
      );
      return;
    }
    this.isAddBtnDisable = true;
    this.commonService.presentLoading();
    const payload = this.generatePayLoad(formRef.value);
    await this.dataBaseService.createDataRecords(payload);

    this.routeToClientList(formRef);
  }

  routeToClientList(formRef) {
    let message = 'These records have been added successfully.';
    message += formRef.value.multiRecordsSelected
      ? ''
      : '<br>Redirecting to the Clients List tab.';

    setTimeout(() => {
      this.isAddBtnDisable = false;
      this.commonService.presentToast(message);
      if (!formRef.value.multiRecordsSelected) {
        this.router.navigate(['..']).then(() => {
          formRef.resetForm();
          // Reset transactions to just one after successful submit/navigate
          this.transactions = [
            {
              principal: null,
              interest: null,
              startDate: this.commonService.today,
            },
          ];
        });
      } else {
        this.dataBaseService.getAllClientsData().then((res) => {
          this.clientsData = res;
        });
      }
    }, 1000);
  }

  changeRadio(event) {
    this.formRefVariable.form.controls.recordType.setValue(event);
  }

  formatPresetLabel(preset: any): string {
    return this.presetService.formatPresetLabel(preset);
  }

  applyPreset(preset: any) {
    const transLen = this.transactions.length;
    if (transLen > 0) {
      this.transactions[transLen - 1].principal = preset.principal;
      this.transactions[transLen - 1].interest = preset.interest;
    }
    this.commonService.presentToast(
      'Preset applied to last transaction',
      'successToastClass',
      'checkmark-circle'
    );
  }

  saveCurrentAsPreset() {
    const transLen = this.transactions.length;
    if (transLen > 0) {
      const principal = this.transactions[transLen - 1].principal;
      const interest = this.transactions[transLen - 1].interest;

      if (principal && interest) {
        this.presetService.addPreset({ principal, interest });
        this.presets = this.presetService.getPresets();
        this.commonService.presentToast(
          'Preset saved',
          'successToastClass',
          'bookmark'
        );
      } else {
        this.commonService.presentToast(
          'Enter principal and interest in last transaction',
          'failedToastClass',
          'alert-circle'
        );
      }
    }
  }
}
