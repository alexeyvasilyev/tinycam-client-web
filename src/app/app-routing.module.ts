import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AdminComponent, EventsComponent, LoginComponent, PageNotFoundComponent, TimelineComponent } from './components';
import { AuthGuard } from './guards';

const routes: Routes = [
  { path: '',        redirectTo: 'events', pathMatch: 'full' },
  { path: 'login',   component: LoginComponent },
  { path: 'events',  component: EventsComponent,   canActivate: [AuthGuard] },
  { path: 'timeline',component: TimelineComponent, canActivate: [AuthGuard] },
  { path: 'admin',   component: AdminComponent,    canActivate: [AuthGuard] },
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
