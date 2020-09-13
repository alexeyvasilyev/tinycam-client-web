import { Component } from '@angular/core';
import { LoginService } from '../services';

@Component({
    // animations: [animateFactory(150, 0, 'ease-in')],
    styles: [ `
      .my-button {
        margin: 5px 10px;
        text-transform: uppercase;
      }
    `],
    template: `
      <header [selected]="0" [isAdmin]="this.loginService.login.isAdmin()"></header>
      <table id="table1" width="100%" height="90%" style="border-spacing:3px;border-collapse:separate;background-color:#757575;">
        <tr height="94%" valign="bottom">
            <td id="cell0" class="cell" width="50%" onclick="showPopup(0);" ondblclick="location.href='/live?cameraId=182399567'">
            <!--<img id="image0" alt="" onload="loadImage(0);" onerror="loadImageError(0)"/>-->
            <live [camId]="182399567"></live>
            </td>
            <td id="cell1" class="cell" width="50%" onclick="showPopup(1);" ondblclick="location.href='/live?cameraId=1455317736'">
            <!--<img id="image1" alt="" onload="loadImage(1);" onerror="loadImageError(1)"/>-->
            </td>
        </tr>
      </table>
    `
})

export class LiveCamComponent {

  constructor(
    public loginService: LoginService) {
  }


}
