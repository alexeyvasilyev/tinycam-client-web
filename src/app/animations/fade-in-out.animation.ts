import { trigger, animate, transition, style } from '@angular/animations';

export const fadeInOutAnimation =
    trigger('fadeInOutAnimation', [
        transition(':enter', [
            // styles at start of transition
            style({ opacity: 0 }),
            // animation and styles at end of transition
            animate('.3s', style({ opacity: 1 }))
        ]),
        transition(':leave', [
            // styles at start of transition
            style({ opacity: 1 }),
            // animation and styles at end of transition
            animate('.3s', style({ opacity: 0 }))
        ]),
    ]);
