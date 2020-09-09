import { Component, OnInit } from '@angular/core';
import { EventCamListComponent } from './event-cam-list.component';

@Component({
  styles: [ ``
  ],
  template: `
    <header [selected]="0"></header>
    <event-cam-list></event-cam-list>
  `
})

export class EventsComponent implements OnInit {

    constructor () {
    }

    ngOnInit() {
    }

}
