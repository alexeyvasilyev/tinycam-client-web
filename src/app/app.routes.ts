import { Routes } from '@angular/router';
import { LoginComponent, PageAdminComponent, PageEventsComponent, PageLiveComponent, PageLiveMultipleComponent, PageNotFoundComponent, PageTimelineComponent } from './components';
import { AuthGuard } from './guards';

export const routes: Routes = [
  { path: '',        redirectTo: 'events', pathMatch: 'full' },
  { path: 'login',   component: LoginComponent },
  { path: 'livem',   component: PageLiveMultipleComponent, canActivate: [AuthGuard] },
  { path: 'live',    component: PageLiveComponent,     canActivate: [AuthGuard] },
  { path: 'events',  component: PageEventsComponent,   canActivate: [AuthGuard] },
  { path: 'timeline',component: PageTimelineComponent, canActivate: [AuthGuard] },
  { path: 'admin',   component: PageAdminComponent,    canActivate: [AuthGuard] },
  { path: '**',      component: PageNotFoundComponent }
];
