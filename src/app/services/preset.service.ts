import { Injectable } from '@angular/core';

export interface TransactionPreset {
    principal: number;
    interest: number;
    label?: string;
}

@Injectable({
    providedIn: 'root'
})
export class PresetService {
    private readonly PRESETS_KEY = 'transaction_presets';
    private readonly MAX_PRESETS = 10;

    // Default presets
    private defaultPresets: TransactionPreset[] = [
        { principal: 100000, interest: 1.5 },
        { principal: 200000, interest: 1.5 },
        { principal: 250000, interest: 1.5 },
        { principal: 500000, interest: 1.25 }
    ];

    getPresets(): TransactionPreset[] {
        const stored = localStorage.getItem(this.PRESETS_KEY);
        return stored ? JSON.parse(stored) : this.defaultPresets;
    }

    addPreset(preset: TransactionPreset) {
        const presets = this.getPresets();

        // Check if preset already exists
        const exists = presets.some(p =>
            p.principal === preset.principal && p.interest === preset.interest
        );

        if (!exists) {
            presets.unshift(preset);

            // Keep only MAX_PRESETS
            if (presets.length > this.MAX_PRESETS) {
                presets.pop();
            }

            localStorage.setItem(this.PRESETS_KEY, JSON.stringify(presets));
        }
    }

    removePreset(index: number) {
        const presets = this.getPresets();
        presets.splice(index, 1);
        localStorage.setItem(this.PRESETS_KEY, JSON.stringify(presets));
    }

    formatPresetLabel(preset: TransactionPreset): string {
        const principal = preset.principal >= 100000
            ? `${(preset.principal / 1000).toFixed(0)}K`
            : preset.principal.toString();
        return `${principal} | ${preset.interest}`;
    }
}
