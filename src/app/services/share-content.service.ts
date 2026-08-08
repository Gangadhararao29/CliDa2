import { Injectable } from '@angular/core';
import { Share } from '@capacitor/share';
import { CommonService } from './common.service';

@Injectable({
  providedIn: 'root',
})
export class ShareContentService {
  constructor(private commonService: CommonService) {}

  async shareText(content: string) {
    try {
      await Share.share({ text: content });
      return;
    } catch {
      const cb = navigator.clipboard;
      if (!cb) {
        this.commonService.presentToast(
          'Sharing is unavailable on this device.',
          'warningToastClass',
          'alert-circle-outline',
        );
        return;
      }

      await cb.writeText(content);
      this.commonService.presentToast(
        'The data has been copied to the clipboard successfully.',
      );
    }
  }
}
