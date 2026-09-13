import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
    template: `
    <div class="app-container"><br/>
      <!-- <mat-card> -->
        <h2>Inconceivable 404!</h2>
        <div>I do not think this page is where you think it is.</div>
      <!-- </mat-card> -->
    </div>
  `,
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class PageNotFoundComponent { }
