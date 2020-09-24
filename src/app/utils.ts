import { EventRecord } from './models'

export default class Utils {

    static hasCapability(capability: number, capabilitiesMask: number): boolean  {
        return (capabilitiesMask & capability) != 0;
    }

    static humanReadableByteCount(bytes: number): string {
        var i = Math.floor( Math.log(bytes) / Math.log(1024) );
        return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + ['B', 'kB', 'MB', 'GB', 'TB'][i];
    }

    static humanReadableTime(msec: number): string {
        const minCount = Math.floor(msec / (60 * 1000));
        const hourCount = Math.floor(minCount / 60);
        const dayCount = Math.floor(hourCount / 24);
        if (dayCount > 0) {
            return dayCount + " day " + (hourCount % 24) + " hour";
        } else if (hourCount > 0) {
            return hourCount + " hour " + (minCount % 60) + " min";
        } else {
            return minCount + " min";
        }
    }


    static getEventColor(event: EventRecord): string {
      if (event.motion === undefined)
          return null;
      switch (event.motion) {
          case 'audio':   return '#ae5a41';
          case 'person':  return '#74559e';
          case 'vehicle': return '#1b85b8';
          case 'face':    return '#827717';
          case 'pet':     return '#784646';
          case 'motion':
          default:        return '#5a5255'
        }
    }

    static isPrivateIpAddress(ip: string): boolean {
        if (ip == null)
            return false;
        var parts = ip.split('.');
        return parts.length == 4 &&
            (parts[0] === '10' ||
            (parts[0] === '172' && (parseInt(parts[1], 10) >= 16 && parseInt(parts[1], 10) <= 31)) ||
            (parts[0] === '192' && parts[1] === '168'));
    }

    static isBrowserFirefox(): boolean {
        var ua = window.navigator.userAgent;
        var chrome = ua.indexOf('Firefox');
        return chrome > 0;
    }

    static isBrowserChrome(): boolean {
        var ua = window.navigator.userAgent;
        var chrome = ua.indexOf('Chrome');
        return chrome > 0;
    }

    static isBrowserIE(): boolean {
        var ua = window.navigator.userAgent;

      // Test values; Uncomment to check result …

      // IE 10
      // ua = 'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.2; Trident/6.0)';

      // IE 11
      // ua = 'Mozilla/5.0 (Windows NT 6.3; Trident/7.0; rv:11.0) like Gecko';

      // IE 12 / Spartan
      // ua = 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.71 Safari/537.36 Edge/12.0';

      // Edge (IE 12+)
      // ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2486.0 Safari/537.36 Edge/13.10586';

        var msie = ua.indexOf('MSIE ');
        if (msie > 0) {
            return true;
        }

        var trident = ua.indexOf('Trident/');
        if (trident > 0) {
            return true;
        }

        var edge = ua.indexOf('Edge/');
        if (edge > 0) {
            return true;
        }

        // other browser
        return false;
    }

    static startFullScreen(element) {
      if (element.requestFullscreen) {
        element.requestFullscreen();
      } else if (element.mozRequestFullScreen) {
        element.mozRequestFullScreen();
      } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
      } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen();
      }
    }

    static cancelFullScreen() {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }

    static toggleFullScreen(element) {
      const isInFullScreen = (document.fullscreenElement && document.fullscreenElement !== null);
      if (!isInFullScreen) {
        Utils.startFullScreen(element);
      } else {
        Utils.cancelFullScreen();
      }
    }
}
