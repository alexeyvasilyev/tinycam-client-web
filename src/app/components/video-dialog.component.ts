import { Component, OnInit, AfterViewInit, ElementRef, ChangeDetectionStrategy, inject, viewChild } from '@angular/core';
import { MatDialog, MatDialogTitle, MatDialogClose, MAT_DIALOG_DATA } from '@angular/material/dialog';

import videojs from 'video.js';
import { MatIconButton } from '@angular/material/button';

export interface VideoDialogData {
    title: string;
    videoUrl: string;
    imageUrl?: string;
}

@Component({
    selector: 'video-dialog',
    template: `
    <table style="border-spacing:3px;border-collapse:separate;width:100%;">
      <tr>
        <td width="90%">
          <div mat-dialog-title style="margin: auto;">{{data.title}}
            @if (videoError) {
              <span style="color:red">Video loading error!</span>
            }</div>
          </td>
          <td width="10%" style="text-align:right;">
            <button mat-icon-button mat-dialog-close><i class="fas fa-times" aria-hidden="true"></i></button>
          </td>
        </tr>
      </table>
    
      <video animate.enter="app-fade-in" #component id='mp4video' class="video-js vjs-default-skin vjs-big-play-centered"
        controls (error)="handleVideoError()" (playing)="handleVideoPlaying()" poster="{{data.imageUrl}}"
        data-setup='{"playbackRates": [0.1, 0.5, 1, 2, 3]}'>
      </video>
    `,
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [MatDialogTitle, MatIconButton, MatDialogClose]
})
export class VideoDialogComponent implements OnInit, AfterViewInit {
    readonly data: VideoDialogData = inject(MAT_DIALOG_DATA);
    readonly componentEl = viewChild<ElementRef>('component');

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

    ngOnInit() {
        this.fitToContainerWidth(this.componentEl().nativeElement);
    }

    private fitToContainerWidth(element) {
        // TODO: document.documentElement.clientWidth is refreshed only after refresh button pressed in browser.
        element.width = document.documentElement.clientWidth * 0.6;
    }

    ngAfterViewInit() {
      // console.log('ngAfterViewInit');
        // const self = this;
        this.player = videojs(document.getElementById('mp4video'));
        // console.log(this.player);
        this.player.muted(true);
        this.player.src({
            src: this.data.videoUrl,
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
