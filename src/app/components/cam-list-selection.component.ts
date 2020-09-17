import { Component, OnInit } from '@angular/core';
import { CameraSettings } from '../models';
import { CamListService, LoginService } from '../services';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import StorageUtils from '../utils-storage';

@Component({
    template: ``
})

export class CamListSelectionComponent implements OnInit {

    cameras: CameraSettings[] = null;
    camId = StorageUtils.getLastCameraSelected(); // all cameras
    errorMessage: string = null;
    responseCode: number = -1;

    constructor(
        protected router: Router,
        protected loginService: LoginService,
        protected camListService: CamListService) {
    }

    ngOnInit() {
        this.camListService.getCamList(this.loginService.server, this.loginService.login)
            .then(
                res  => { this.processCamList(res); },
                error => { this.processCamListError(error); });
            // .catch(this.processCamListError);
    }

    onSelected(camId: number): void {
        console.log('Selected camera: ' + camId);
        // this.camId = camId;
        StorageUtils.setLastCameraSelected(camId);
        // console.log('Selected: "' + target.value + '", camId: ' + camIdSelected);
    }

    processCamListError(error: HttpErrorResponse) {
        console.error('Error in getCamList()', error.message);
        // Token expired
        if (error.status == 401)
            this.router.navigate(['/login']);
//        if (!this.isConnected) {
//            this.errorMessage = "Check Internet connection";
//        } else {
            this.errorMessage = error.message;
//        }
        this.responseCode = -1;
    }

    processCamList(cameras: CameraSettings[]) {
        console.log('processCamList()');
        // this.responseCode = res.code;
        // if (res.code != 100) {
        //     this.errorMessage = res.message;
        // }

        // let cameras = res.data as CameraSettings[];
        if (cameras) {
            this.cameras = cameras;
            console.log('Total cameras: ' + cameras.length);
        } else {
            console.log('No cameras found.');
        }

        // var newCameras = [];
        // var newWarnings = [];
        // if (cameras) {
        //     for (let i = 0; i < cameras.length; i++) {
        //         if (cameras[i].id != null) {
        //             newCameras.push(cameras[i]);
        //             if (cameras[i].cam_last_error != null && cameras[i].cam_last_error.length > 0) {
        //                 newWarnings.push(cameras[i]);
        //             }
        //         }
        //     }
        // }
        // this.cameras = newCameras;
        // this.warnings = newWarnings;
        // // console.log('Filtered cameras: ' + newCameras.length + ', warnings: ' + newWarnings.length);

        this.camerasLoaded();
        // this.eventListService.getEventList(this.server, this.login, -1 /*all cameras*/)
        //     .then(events => { this.processEventList(events); });
    }

    camerasLoaded() {
        if (this.camId == -1 && this.cameras.length > 0) {
            for (let camera of this.cameras) {
                if (camera.enabled) {
                    this.camId = camera.id;
                    break;
                }
            }
            this.camId = this.cameras[0].id;
        }
    }

    getCameraName(cameraSettings: CameraSettings): string {
        return CameraSettings.getName(cameraSettings);
    }

}
