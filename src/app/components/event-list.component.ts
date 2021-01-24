import { Component, OnInit, Input, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { EventRecord, CameraSettings, } from '../models';
import { EventListService, LoginService } from '../services';
import { HttpErrorResponse } from '@angular/common/http';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { fadeInAnimation } from '../animations/';

// <video> tag is shown only for Chrome/Firefox/Safari browsers. Not shown for IE.
// For Chrome browser only first 5 events are shown as <video>,
// the rest one are <image> (preventing too many active sockets issue).
@Component({
  selector: 'event-list',
  animations: [fadeInAnimation],
  styles: [ `
    .recordings-date-class {
        background: #EEEEEE;
        border-radius: 100%;
    }
    .container-event-list {
        margin: 0px 10px;
        height: auto;
        overflow: hidden;
     }
    .right-event-list {
         width: 50%;
         float: right;
     }
    .left-event-list {
        float: left;
        width: 50%;
        text-align: right;
        overflow: hidden;
     }
  `],
  encapsulation: ViewEncapsulation.None,
  template: `
  <div>

    <div class="container-event-list" style="padding-top: 20px">
      <div class="left-event-list" style="min-width:250px">
        <mat-form-field style="padding:0px 15px">
          <input matInput [max]="today" [matDatepicker]="picker" placeholder="Choose a date" (dateChange)="onDateChanged($event)">
          <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
          <mat-datepicker [dateClass]="dateClass" #picker></mat-datepicker>
        </mat-form-field>
      </div>
      <div class="right-event-list" style="min-width:250px">
        <mat-form-field style="padding:0px 15px">
          <mat-select [(value)]="filterSelected" [disabled]="type === 'cloud'" (selectionChange)="onFilterSelected($event.value)" placeholder="Filter">
            <mat-option>All events</mat-option>
            <mat-option [value]="'pin'">📌 Pinned</mat-option>
            <mat-option [value]="'motion'">🍃 Motion</mat-option>
            <mat-option [value]="'person'">🚶🏽 Person</mat-option>
            <mat-option [value]="'vehicle'">🚗 Vehicle</mat-option>
            <mat-option [value]="'pet'">🐕 Pet</mat-option>
            <mat-option [value]="'audio'">🔊 Audio</mat-option>
            <mat-option [value]="'face'">👨 Face</mat-option>
          </mat-select>
        </mat-form-field>
      </div>
    </div>

    <mat-card *ngIf="!eventsLoaded">
      Loading events...
    </mat-card>
    <div *ngIf="eventsLoaded">
      <div *ngIf="events.length > 0; else no_events_content">
        <p class="app-text-dark-secondary app-text-center" style="padding-top: 5px; padding-bottom: 5px">TIP: Hold mouse cursor on image for a couple seconds to show recorded video.</p>
        <div
            infinite-scroll
            [infiniteScrollDistance]="2"
            [infiniteScrollThrottle]="100"
            (scrolled)="onScroll()">
            <div *ngFor="let event of events; let i = index" style="margin-bottom:20px;">
                <event
                    [number]="i"
                    [event]="event"
                    [actionCommands]="loginService.login.isAdmin()"></event>
            </div>

            <div *ngIf="isFabShown()" style="position: fixed;right: 50px; bottom: 50px;">
                <div [@fadeInAnimation]>
                    <button mat-mini-fab color="accent" (click)="goTop()">
                        <span><i class="fas fa-angle-up"></i></span>
                    </button>
                </div>
            </div>
        </div>
      </div>
      <ng-template #no_events_content>
        <mat-card class="app-text-center" style="padding-bottom: 20px">
          <p class="app-text-dark">No events found.</p>
        </mat-card>
      </ng-template>
    </div>
  `
})

export class EventListComponent implements OnInit {

    private EVENTS_TO_LOAD = 15;

    events: EventRecord[] = [];
    eventsLoaded = false;
    // autoplayOnHover = false;
    showFab = false;
    filterSelected = undefined;

    constructor(
        private loginService: LoginService,
        private eventListService: EventListService) {
    }

    @Input() cameraId: number; // can be -1 for all cameras events
    @Input() cameras: CameraSettings[];
    @Input() type: string = 'local'; // 'local' or 'cloud'

            today: Date = new Date(); // today
    private minus7days: Date = new Date(this.today.getTime() - 604800000 /*7 days*/);
            // minus6days: Date = new Date(this.today.getTime() - 518400000 /*6 days*/);

    dateClass = (d: Date) => {
        const date = d.getTime();
        const minus7daysMsec = this.minus7days.getTime();
        return (date <= this.today.getTime() && date >= minus7daysMsec) ? 'recordings-date-class' : undefined;
    }

    isFabShown() {
        return document.documentElement.scrollTop > document.documentElement.clientHeight;
    }

    onFilterSelected(filter: string) {
        console.log(`onFilterSelected(filter=${filter})`);
        this.loadLastEvents();
    }

    ngOnInit() {
        // console.log('ngOnInit())');
        // this.loadLastEvents();
        //this.autoplayOnHover = this.platform.FIREFOX;
    }

    ngOnChanges(changes: SimpleChanges) {
        // console.log('EventListComponent::ngOnChanges()');
        // for (let propName in changes) {
        //     let chng = changes[propName];
        //     // console.log('ngOnChanges() cur: ' + chng.currentValue);
        // }
        this.filterSelected = '';
        this.loadLastEvents();
    }

    goTop() {
        console.log('goTop()');
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'smooth'
        });
    }

    private loadLastEvents() {
        // Clear events
        this.events = [];
        this.eventsLoaded = false;
        // this.eventListService.getEventListByDate(
        //     this.loginService.server,
        //     this.loginService.login,
        //     this.cameraId,
        //     '2017-02-21T13:30:40+00:00',
        //     this.EVENTS_TO_LOAD)
        //         .then(events => { this.processEventList(events); });
        this.eventListService.getEventList(
            this.loginService.server,
            this.loginService.login,
            this.cameraId,
            -1,
            this.EVENTS_TO_LOAD,
            this.type,
            this.filterSelected)
                .then(events => { this.processEventList(events); },
                      error => { this.processEventListError(error); });
    }

    onScroll() {
        console.log('Loading more ' + this.EVENTS_TO_LOAD + ' events...');
        const event = this.events[this.events.length - 1];
        this.eventListService.getEventList(
            this.loginService.server,
            this.loginService.login,
            this.cameraId,
            event.time,
            this.EVENTS_TO_LOAD,
            this.type,
            this.filterSelected)
                .then(events => { this.processEventList(events); },
                      error => { this.processEventListError(error); });
    }

    private processEventListError(error: HttpErrorResponse) {
        console.error('Error in getCamList()', error.message);
        // Token expired
        // if (error.status == 401 || error.status == 403)
        //     this.router.navigate(['/login']);
        //     this.errorMessage = error.message;
        // this.responseCode = -1;
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
            // for (let event of events) {
            //     this.events.push(event);
            // }
            this.events = this.events.concat(events);
            // console.log('Filtered events: ' + newEvents.length);
            console.log('Loaded ' + this.events.length + ' events' );
        } else {
            console.log('Events list is empty');
        }

        this.eventsLoaded = true;
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
                this.cameraId,
                selectedDate.getTime(),
                this.EVENTS_TO_LOAD,
                this.type,
                this.filterSelected)
                    .then(events => { this.processEventList(events); });
        }
    }

}
