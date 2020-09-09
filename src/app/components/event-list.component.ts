import { Component, OnInit, Input, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { EventRecord, Login, Server, CameraSettings, } from '../models';
// import { FormControl } from '@angular/forms';
import { EventListService, LoginService } from '../services';
import { MatDatepicker, MatDatepickerInputEvent } from '@angular/material/datepicker';
import { Platform } from '@angular/cdk/platform';

// <video> tag is shown only for Chrome/Firefox/Safari browsers. Not shown for IE.
// For Chrome browser only first 5 events are shown as <video>,
// the rest one are <image> (preventing too many active sockets issue).
@Component({
  selector: 'event-list',
  styles: [ `
    .recordings-date-class {
      background: #EEEEEE;
      border-radius: 100%;
    }
  `],
  encapsulation: ViewEncapsulation.None,
  template: `
  <div>
    <div class="app-text-center" style="padding-bottom: 20px">
      <mat-form-field style="padding-top: 20px">
        <input matInput [min]="minus6days" [max]="today" [matDatepicker]="picker" placeholder="Choose a date" (dateChange)="onDateChanged($event)">
        <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
        <mat-datepicker [dateClass]="dateClass" #picker></mat-datepicker>
      </mat-form-field>
    </div>
    <mat-card *ngIf="!eventsLoaded">
      Loading events...
    </mat-card>
    <div *ngIf="eventsLoaded">
      <div *ngIf="events.length > 0; else no_events_content">
        <p *ngIf="autoplayOnHover" class="app-text-dark-secondary" style="padding-top: 5px; padding-bottom: 5px">TIP: Hold mouse cursor on image for a couple seconds to show recorded video.</p>
        <div
            infinite-scroll
            [infiniteScrollDistance]="2"
            [infiniteScrollThrottle]="100"
            (scrolled)="onScroll()">
            <div *ngFor="let event of events; let i = index" style="margin-bottom:20px;">
                <event
                    [number]="i"
                    [title]="getEventTitle(event)"
                    [titleHint]="getEventTitleHint(event)"
                    [imageUrl]="getEventImage(event)"
                    [videoUrl]="getEventVideo(event)"
                    [hasVideo]="event.has_video"
                    [hasAudio]="event.has_audio"
                    [date]="event.time"></event>
            </div>
        </div>
      </div>
      <ng-template #no_events_content>
        <mat-card class="app-text-center" style="padding-bottom: 20px">
          <p class="app-text-dark">No motion events found.</p> If you just added a camera, <b>please wait for 15 minutes</b> to get recordings available.
        </mat-card>
      </ng-template>
    </div>
  `
})

export class EventListComponent implements OnInit {

    private EVENTS_TO_LOAD = 30;

    events: EventRecord[] = [];
    eventsLoaded = false;
    autoplayOnHover = false;
    // camerasMap: Map<number, CameraRecord> = new Map();

    constructor(
        private loginService: LoginService,
        private eventListService: EventListService,
        public platform: Platform) {
    }

    @Input() camId: number; // can be -1 for all cameras events
    @Input() cameras: CameraSettings[];

            today: Date = new Date(); // today
    private minus7days: Date = new Date(this.today.getTime() - 604800000 /*7 days*/);
            minus6days: Date = new Date(this.today.getTime() - 518400000 /*6 days*/);

    dateClass = (d: Date) => {
        const date = d.getTime();
        const minus7daysMsec = this.minus7days.getTime();
        return (date <= this.today.getTime() && date >= minus7daysMsec) ? 'recordings-date-class' : undefined;
    }

    ngOnInit() {
        // console.log('ngOnInit())');
        // this.loadLastEvents();
        this.autoplayOnHover = this.platform.FIREFOX;

        // // Mapping cam id to cam name
        // // 15593704483417 - "Cam 1"
        // // 15123704434122 - "Cam 2"
        // for (let camera of this.cameras) {
        //     let cameraRecord = new CameraRecord();
        //     cameraRecord.name = camera.name;
        //     this.camerasMap.set(camera.id, cameraRecord);
        // }
    }

    ngOnChanges(changes: SimpleChanges) {
        // console.log('EventListComponent::ngOnChanges()');
        // for (let propName in changes) {
        //     let chng = changes[propName];
        //     // console.log('ngOnChanges() cur: ' + chng.currentValue);
        // }
        this.loadLastEvents();
    }

    private loadLastEvents() {
        // Clear events
        this.events = [];
        this.eventsLoaded = false;
        // this.eventListService.getEventListByDate(
        //     this.loginService.server,
        //     this.loginService.login,
        //     this.camId,
        //     '2017-02-21T13:30:40+00:00',
        //     this.EVENTS_TO_LOAD)
        //         .then(events => { this.processEventList(events); });
        this.eventListService.getEventList(
            this.loginService.server,
            this.loginService.login,
            this.camId,
            null,
            this.EVENTS_TO_LOAD)
                .then(events => { this.processEventList(events); });
    }

    onScroll() {
        console.log('Loading more ' + this.EVENTS_TO_LOAD + ' events...');
        let event = this.events[this.events.length - 1];
        this.eventListService.getEventList(
            this.loginService.server,
            this.loginService.login,
            this.camId,
            event.time,
            this.EVENTS_TO_LOAD)
                .then(events => { this.processEventList(events); });
    }

    processEventList(events: EventRecord[]) {
        if (events) {
            // console.log('Events: ' + events.length);
            // var newEvents = [];
            // for (let event of events) {
            //     if (event.duration > this.MIN_DURATION_EVENT_MSEC) {
            //         newEvents.push(event);
            //     }
            // }
            // for (let event of newEvents) {
            //     this.events.push(event);
            // }
            // Concatinate arrays
            for (let event of events) {
                this.events.push(event);
            }
            // console.log('Filtered events: ' + newEvents.length);
            console.log('Loaded ' + events.length + ' events' );
        } else {
            console.log('Events list is empty');
        }

        this.eventsLoaded = true;
    }

    getEventTitle(event: EventRecord): string {
        return 'Motion - ' + (event.duration / 1000).toFixed() + ' sec';
    }

    getEventTitleHint(event: EventRecord): string {
        return event.motion;
    //     return (this.camId == -1 && this.cameras.length > 1) ? this.camerasMap.get(event.cid).name : null;
    }

    getEventImage(event: EventRecord): string {
        return `${this.loginService.server.server_addr}${event.image}?token=${this.loginService.login.token}`;
    }

    getEventVideo(event: EventRecord): string {
        return `${this.loginService.server.server_addr}${event.video}?token=${this.loginService.login.token}`;
    }

    onDateChanged(event: MatDatepickerInputEvent<Date>) {
        console.log('Date selected "' + new Date(event.value).toISOString() + '"');
        this.eventsLoaded = false;

        // Today selected
        if (event.value == null) {
            this.loadLastEvents();

        // Custom date selected
        } else {
            // Clear events
            this.events = [];

            let selectedDate = new Date(event.value);
            // var tomorrow = new Date();
            selectedDate.setDate(selectedDate.getDate() + 1);
            this.eventListService.getEventList(
                this.loginService.server,
                this.loginService.login,
                this.camId,
                selectedDate.getTime(),
                this.EVENTS_TO_LOAD)
                    .then(events => { this.processEventList(events); });
        }
    }


}
