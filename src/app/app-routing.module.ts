import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LoginComponent, PageAdminComponent, PageEventsComponent, PageLiveComponent, PageNotFoundComponent, PageTimelineComponent } from './components';
import { AuthGuard } from './guards';

const routes: Routes = [
  { path: '',        redirectTo: 'events', pathMatch: 'full' },
  { path: 'login',   component: LoginComponent },
  { path: 'live',    component: PageLiveComponent,  canActivate: [AuthGuard] },
  { path: 'events',  component: PageEventsComponent,canActivate: [AuthGuard] },
  { path: 'timeline',component: PageTimelineComponent,  canActivate: [AuthGuard] },
  { path: 'admin',   component: PageAdminComponent, canActivate: [AuthGuard] },
  { path: '**',      component: PageNotFoundComponent }
// { path: '**',      component: LoginComponent },
// { path: '', redirectTo: '/events', pathMatch: 'full' },
// { path: 'events',  component: MainComponent },
// { path: '', component: MainComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
