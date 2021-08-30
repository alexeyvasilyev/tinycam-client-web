import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
//import { MatChipsModule } from '@angular/material/chips';
// import { MatToolbarModule } from '@angular/material/toolbar';
// import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
// import { MatRadioModule } from '@angular/material/radio';
import { MatMenuModule } from '@angular/material/menu';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
// import { MatSliderModule } from '@angular/material/slider';
import { MatSnackBarModule } from '@angular/material/snack-bar';
// import { MatTableModule } from '@angular/material/table';
import {
  CamListService,
  EventListService,
  GenericService,
  IpAddressesService,
  IpLocateService,
  LoginService,
  LogoutService,
  StatusService,
  WindowRefService
} from './services';
import {
  CamListSelectionComponent,
  EventCamListComponent,
  EventListComponent,
  EventComponent,
  HeaderComponent,
  LiveComponent,
  LiveMultipleComponent,
  LiveCamListComponent,
  LiveInfoDialogComponent,
  LiveSetPresetDialogComponent,
  LoginComponent,
  PageAdminComponent,
  PageLiveComponent,
  PageLiveMultipleComponent,
  PageTimelineComponent,
  PageEventsComponent,
  PageNotFoundComponent,
  TimelineComponent,
  TimelineCamListComponent,
  VideoDialogComponent,
} from './components';
import { AuthGuard } from './guards';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MomentModule } from 'ngx-moment';

@NgModule({
  declarations: [
    AppComponent,
    CamListSelectionComponent,
    EventCamListComponent,
    EventListComponent,
    EventComponent,
    HeaderComponent,
    LiveComponent,
    LiveMultipleComponent,
    LiveCamListComponent,
    LiveInfoDialogComponent,
    LiveSetPresetDialogComponent,
    LoginComponent,
    PageAdminComponent,
    PageLiveComponent,
    PageLiveMultipleComponent,
    PageEventsComponent,
    PageTimelineComponent,
    PageNotFoundComponent,
    TimelineComponent,
    TimelineCamListComponent,
    VideoDialogComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    InfiniteScrollModule,
    HttpClientModule,
    AppRoutingModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    // MatChipsModule,
    MatDatepickerModule,
    MatDialogModule,
    // MatToolbarModule,
    // MatIconModule,
    MatInputModule,
    MatCheckboxModule,
    MatMenuModule,
    MatNativeDateModule,
    // MatRadioModule,
    MatSelectModule,
    // MatSliderModule,
    MatSnackBarModule,
    // MatTableModule,
    MatTooltipModule,
    MomentModule,
    FormsModule
  ],
  providers: [
    AuthGuard,
    CamListService,
    EventListService,
    GenericService,
    IpAddressesService,
    IpLocateService,
    LoginService,
    LogoutService,
    StatusService,
    WindowRefService,
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
