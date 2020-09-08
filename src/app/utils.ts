export default class Utils {

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

    // static cancelFullScreen() {
    //   if (document.exitFullscreen) {
    //     document.exitFullscreen();
    //   } else if (document.mozCancelFullScreen) {
    //     document.mozCancelFullScreen();
    //   } else if (document.webkitCancelFullScreen) {
    //     document.webkitCancelFullScreen();
    //   } else if (document.msExitFullscreen) {
    //     document.msExitFullscreen();
    //   }
    // }

    // static toggleFullScreen(element) {
    //   var isInFullScreen = (document.fullscreenElement && document.fullscreenElement !== null) ||
    //         (document.webkitFullscreenElement && document.webkitFullscreenElement !== null) ||
    //         (document.mozFullScreenElement && document.mozFullScreenElement !== null) ||
    //         (document.msFullscreenElement && document.msFullscreenElement !== null);
    //   if (!isInFullScreen) {
    //     Utils.startFullScreen(element);
    //   } else {
    //     Utils.cancelFullScreen();
    //   }
    // }
}
