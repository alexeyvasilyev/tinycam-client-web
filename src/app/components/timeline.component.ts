import { Component } from '@angular/core';
import { EventRecord } from '../models';
import { LoginService } from '../services';

@Component({
  template: `
    <header [selected]="1"></header>
    <timeline-cam-list></timeline-cam-list>
  `
})

export class TimelineComponent {

    constructor (
        private loginService: LoginService) {
    }

}
