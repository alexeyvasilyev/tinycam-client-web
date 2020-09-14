import { Component, ElementRef, ViewChild } from '@angular/core';
import { LoginService, WindowRefService } from '../services';
import ResizeObserver from 'resize-observer-polyfill';

@Component({
    // animations: [animateFactory(150, 0, 'ease-in')],
    styles: [ `
    img {
        display: none;
      }
      .cell:hover .cover {
        display: block;
      }
    `],
    template: `
    <div #component>
        <header [selected]="0" [isAdmin]="this.loginService.login.isAdmin()"></header>
        <div #lives style="background-color: #212121; overflow: auto;" [style.height.px]="myInnerHeight">
            <live [camId]="182399567"></live>
        </div>
    </div>
    `
})

export class LiveCamComponent {

    @ViewChild('component', { static: true }) componentEl: ElementRef;
    @ViewChild('lives', { static: true }) livesEl: ElementRef;

    myInnerHeight = this.windowRef.nativeWindow.innerHeight;

    constructor(
        private windowRef: WindowRefService,
        public loginService: LoginService) {
    }

//     ngOnInit() {
//         const ro = new ResizeObserver((entries, observer) => {
//             console.log('Resize');
//             this.livesEl.nativeElement.height = 1000;//this.windowRef.nativeWindow.innerHeight;
//             console.log('H: ' + this.livesEl.nativeElement.height);
// //            this.myInnerHeight = this.windowRef.nativeWindow.innerHeight;
//         });
//         ro.observe(this.componentEl.nativeElement);
//     }

    ngAfterViewInit() {
        document.body.style.overflow = 'hidden';
    // this.fitToContainerWidthHeight(this.livesEl.nativeElement);
    }

//   private fitToContainerWidthHeight(element) {
//       console.log('fitToContainerWidthHeight()');
// //      element.height = '100px';
//     // element.style.width = '100%';
// //    document.documentElement.scrollTop > document.documentElement.clientHeight
// //    element.height = document.documentElement.clientHeight;
// //    element.width = element.offsetWidth;
//   }

  goFullScreen(camId: number) {
      console.log(`goFullScreen(camId=${camId})`);
  }

//   <!--      <table id="table1" width="100%" height="90%" style="border-spacing:3px;border-collapse:separate;background-color:#757575;">
//   <tbody>
//     <tr height="94%" valign="bottom">
//       <td id="cell0" width="50%" height="100px" onclick="showPopup(0);" ondblclick="goFullScreen(-1)">
//         <!--<img id="image0" alt="" onload="loadImage(0);" onerror="loadImageError(0)"/>-->
//         <live [camId]="182399567"></live>
//       </td>
//       <td id="cell1" width="50%" onclick="showPopup(1);" ondblclick="location.href='/live?cameraId=1455317736'">
//         <!--<img id="image1" alt="" onload="loadImage(1);" onerror="loadImageError(1)"/>-->
//       </td>
//     </tr>
//   </tbody>
// </table>-->

}
