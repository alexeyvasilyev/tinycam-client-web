import { Component, Input, AfterViewInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

declare const videojs: any;

@Component({
  selector: 'video-dialog',
  template: `
    <table style="border-spacing:3px;border-collapse:separate;width:100%;">
      <tr>
        <td width="90%">
          <div mat-dialog-title style="margin: auto;">{{title}}
          <span *ngIf="videoError" style="color:red">Video loading error!</span></div>
        </td>
        <td width="10%" style="text-align:right;">
          <button mat-icon-button mat-dialog-close><i class="fas fa-times" aria-hidden="true"></i></button>
        </td>
      </tr>
    </table>

    <video width="800px" id='mp4video' class="video-js vjs-default-skin vjs-big-play-centered"
       controls (error)="handleVideoError()" (playing)="handleVideoPlaying()" poster="{{imageUrl}}">
    </video>

  `
})
export class VideoDialogComponent implements AfterViewInit {
    @Input() videoUrl: string;
    @Input() imageUrl: string;
    @Input() title: string;

    player: any;
    videoError = false;

    constructor(public dialog: MatDialog) {
        this.player = false;
    }

    handleVideoError() {
        console.error('Video loading error');
        this.videoError = true;
    }

    handleVideoPlaying() {
        this.videoError = false;
    }

    ngAfterViewInit() {
      // console.log('ngAfterViewInit');
        // const self = this;
        this.player = videojs(document.getElementById('mp4video'));
        // console.log(this.player);
        this.player.muted(true);
        this.player.src({
            src: this.videoUrl,
            type: "video/mp4"
        });
        this.player.play();

        // this.player.on('timeupdate', () => {
        //   let hasDVR = false;
        //   let duration = Math.floor(this.getDuration(this.player) * 1000);
        //   let time;
        //   let seekPercent;
        //   // this.player.controls(true);
        //   console.log(this.player.currentTime(), this.getDuration(this.player));
        // });
    }

    // ngOnDestroy() {
    //   console.log('onDestroy');
    //   this.player.pause();
    // }

    // openDialog() {
    //     this.dialog.open(VideoDialogComponent);
    // }

}
