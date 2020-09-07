import { trigger, animate, transition, style } from '@angular/animations';

export const fadeInAnimation =
    trigger('fadeInAnimation', [
        transition(':enter', [
            // styles at start of transition
            style({ opacity: 0 }),
            // animation and styles at end of transition
            animate('.3s', style({ opacity: 1 }))
        ]),
    ]);
