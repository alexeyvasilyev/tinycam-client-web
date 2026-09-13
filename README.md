# tinyCam app web client written in Angular2
https://tinycammonitor.com
More info is <a href="https://www.reddit.com/r/tinycam/comments/iqnov1/tinycam_150_will_have_completely_redesigned_web_ui/">here</a>.

tinyCam web server main features:
* **Live view up to 4 cameras** at the same time.
* **PTZ and audio support** from live view (admin only).
* **Timeline support** (multiple timelines as well) w/ slow/fast playback.
* **Autoplay event on hover**.
* **Sort events by date and type** (person, vehicle, etc.).
* **Delete and pin events** (admin only).
* Support for **playback cloud events** in web browser.
* **Admin console** (admin only).

PTZ keyboard controls:
* Keys W/A/S/D - pan-tilt
* Keys +/- - optical zoom in/out
* Keys F/N - focus far/near
* Keys O/C - iris open/close
* Keys 1..9 - presets

## See also:
- [Web timeline UI widget written in JavaScript](https://github.com/alexeyvasilyev/timeline-ui-web)
- [tinyCam web server API](https://github.com/alexeyvasilyev/tinycam-api)

## Hacks:
* Adding `remote=yes` to login screen will show remote server input field, e.g `http://192.168.0.3:8083/login?remote=yes`

