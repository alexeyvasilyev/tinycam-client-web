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
    cameraSelected: CameraSettings | number = null; // CameraSettings or number (-1)
    allCamerasSupport: boolean = false;
    localCloudSelected: string = 'local'; // 'local' or 'cloud'
    errorMessage: string = null;

    constructor(
        protected router: Router,
        protected loginService: LoginService,
        protected camListService: CamListService) {
    }

    ngOnInit() {
        // console.log('ngOnInit()');
        this.camListService.getCamList(this.loginService.server, this.loginService.login)
            .subscribe({
                next: (data) => this.processCamList(data),
                error: (e) => this.processCamListError(e)
            })
    }

    ngOnDestroy() {
    }

    onSelected(camera: CameraSettings | number): void {
        console.log(`Selected camera: '${camera instanceof CameraSettings ? camera.name : camera}'`);
        this.localCloudSelected = 'local';
        // this.cameraId = camId;
        //this.cameraSelected = camera;
        StorageUtils.setLastCameraSelected(camera instanceof Object ? camera.id : camera);
        // console.log('Selected: "' + target.value + '", camId: ' + camIdSelected);
    }

    processCamListError(error: HttpErrorResponse) {
        console.error('Error in getCamList()', error.message);
        // Token expired
        if (error.status == 401 || error.status == 403)
            this.router.navigate(['/login']);
//        if (!this.isConnected) {
//            this.errorMessage = "Check Internet connection";
//        } else {
        this.errorMessage = error.message;
//        }
    }

    processCamList(cameras: CameraSettings[]) {
        // console.log('processCamList()');
        if (cameras) {
            this.cameras = cameras;
            console.log('Total cameras: ' + cameras.length);
        } else {
            console.log('No cameras found.');
        }
        this.camerasLoaded();
    }

    camerasLoaded() {
        if (this.cameraSelected == null && this.cameras.length > 0) {
            // Select camera with last saved camId
            const camId = StorageUtils.getLastCameraSelected();
            for (let camera of this.cameras) {
                if (camera.id === camId) {
                    this.cameraSelected = camera;
                    return;
                }
            }
            // No camId found. Try to select first enabled camera.
            // for (let camera of this.cameras) {
            //     if (camera.enabled) {
            //         this.cameraSelected = camera;
            //         return;
            //     }
            // }
            // Select first camera.
            if (this.allCamerasSupport)
                this.cameraSelected = -1;
            else
                this.cameraSelected = this.cameras[0];
        }
    }

    getCameraName(cameraSettings: CameraSettings): string {
        return CameraSettings.getName(cameraSettings);
    }

}
