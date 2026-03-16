import { Injectable } from '@angular/core';
import { LocalStorageUtils, localStorConsts } from '../shared/local-storage';

export interface TransactionPreset {
  principal: number;
  interest: number;
  label?: string;
}

@Injectable({
  providedIn: 'root',
})
export class PresetService {
  private readonly MAX_PRESETS = 10;

  // Default presets
  private defaultPresets: TransactionPreset[] = [
    { principal: 100000, interest: 1.5 },
    { principal: 200000, interest: 1.5 },
    { principal: 250000, interest: 1.5 },
    { principal: 500000, interest: 1.25 },
  ];

  getPresets(): TransactionPreset[] {
    const stored = LocalStorageUtils.getStringItem(localStorConsts.transactionPresets) || '[]';
    const presets = JSON.parse(stored);
    return presets.length ? presets : [...this.defaultPresets];
  }

  addPreset(preset: TransactionPreset) {
    const presets = this.getPresets();

    // Check if preset already exists
    const exists = presets.some(
      (p) => p.principal === preset.principal && p.interest === preset.interest
    );

    if (!exists) {
      presets.unshift(preset);

      // Keep only MAX_PRESETS
      if (presets.length > this.MAX_PRESETS) {
        presets.pop();
      }

      LocalStorageUtils.setItem(localStorConsts.transactionPresets, presets);
    }
  }

  removePreset(index: number) {
    const presets = this.getPresets();
    presets.splice(index, 1);
    LocalStorageUtils.setItem(localStorConsts.transactionPresets, presets);
  }

  formatPresetLabel(preset: TransactionPreset): string {
    const principal =
      preset.principal >= 1000
        ? `${(preset.principal / 1000).toFixed(0)}K`
        : preset.principal.toString();
    return `${principal} | ${preset.interest}`;
  }
}
