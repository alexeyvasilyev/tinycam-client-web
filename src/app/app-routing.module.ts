import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { EventsComponent, LoginComponent, PageNotFoundComponent } from './components';
import { AuthGuard } from './guards';

const routes: Routes = [
  { path: '',        redirectTo: 'events', pathMatch: 'full' },
  { path: 'login',   component: LoginComponent },
  { path: 'events',  component: EventsComponent, canActivate: [AuthGuard] },
  { path: '**',      component: PageNotFoundComponent }
// { path: 'signup', component: SignupComponent },
// { path: '**',      component: LoginComponent },
// { path: '', redirectTo: '/events', pathMatch: 'full' },
// { path: 'events',  component: MainComponent },
// { path: '', component: MainComponent },
// { path: 'account', component: AccountComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
