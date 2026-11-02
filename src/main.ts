import { provideZonelessChangeDetection } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withXhr, withInterceptorsFromDi } from '@angular/common/http';
import { provideNativeDateAdapter } from '@angular/material/core';

import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { AuthGuard } from './app/guards';
import { CamListService, EventListService, GenericService, IpAddressesService, IpLocateService, LoginService, LogoutService, StatusService, WindowRefService } from './app/services';

bootstrapApplication(AppComponent, {
    providers: [
        provideZonelessChangeDetection(),
        provideRouter(routes),
        provideHttpClient(withXhr(), withInterceptorsFromDi()),
        // Used by event list date picker
        provideNativeDateAdapter(),
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
    ]
})
  .catch(err => console.error(err));
