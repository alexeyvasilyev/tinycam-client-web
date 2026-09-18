import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';

export type AppTheme = 'dark' | 'light';

@Injectable({ providedIn: 'root' })
export class ThemeService {
    theme: AppTheme = 'dark';

    constructor(@Inject(DOCUMENT) private document: Document) {
        try {
            if (this.document.defaultView.localStorage.getItem('tinycam-theme') === 'light') {
                this.theme = 'light';
            }
        } catch {
            // Storage may be unavailable; dark remains the default.
        }
        this.applyTheme();
    }

    setTheme(theme: AppTheme) {
        if (theme !== 'dark' && theme !== 'light') return;
        this.theme = theme;
        this.applyTheme();
        try {
            this.document.defaultView.localStorage.setItem('tinycam-theme', theme);
        } catch {
            // The selected theme still works when storage is unavailable.
        }
    }

    private applyTheme() {
        this.document.documentElement.classList.toggle('light-theme', this.theme === 'light');
    }
}
