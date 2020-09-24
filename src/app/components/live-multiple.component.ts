import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { CameraSettings } from '../models';
import { LoginService } from '../services';

@Component({
    styles: [ `
    `],
    template: `
    <div>
    </div>
    `
})

export class LiveMultipleComponent {

    @Input() cameras: CameraSettings[];

    constructor (
        public loginService: LoginService) {
    }

}
