import { ThemeService } from './services/theme.service';
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import StorageUtils from './utils-storage';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [RouterOutlet]
})
export class AppComponent {
  constructor(public themeService: ThemeService, router: Router) {
    router.events.subscribe(event => {
      if (!(event instanceof NavigationEnd)) return;
      StorageUtils.setLastPage(event.urlAfterRedirects.split(/[?#]/)[0].replace(/^\//, ''));
    });
  }

  title = 'tinycam-client-web';
}
