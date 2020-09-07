// function TimeSeries(options) {
//     this.clear();
// }
function Rect(left, top, right, bottom) {
    this.left = left;
    this.top = top;
    this.right = right;
    this.bottom = bottom;
}

function TimeRecord(timestampMsec, durationMsec, object) {
    this.timestampMsec = timestampMsec;
    this.durationMsec = durationMsec;
    this.object = object;
}

const INTERVAL_MIN_1   =            60 * 1000; //  1 min
const INTERVAL_MIN_5   =        5 * 60 * 1000; //  5 min
const INTERVAL_MIN_15  =       15 * 60 * 1000; // 15 min
const INTERVAL_MIN_30  =       30 * 60 * 1000; // 30 min
const INTERVAL_HOUR_1  =       60 * 60 * 1000; //  1 hour
const INTERVAL_HOUR_6  =   6 * 60 * 60 * 1000; //  6 hours
const INTERVAL_HOUR_12 =  12 * 60 * 60 * 1000; // 12 hours
const INTERVAL_DAY_1   =  24 * 60 * 60 * 1000; //  1 day
const INTERVAL_DAY_7   = 168 * 60 * 60 * 1000; //  7 days
const OFFSET_TOP_BOTTOM = 25;

/**
 * Clears all data and state from this TimeSeries object.
 */
// TimeSeries.prototype.clear = function() {
//   console.log("clear()");
//   this.recordsMajor1 = [];
//   this.recordsMajor2 = [];
//   this.recordsBackground = [];
//   this.rectsMajor1 = [];
//   this.rectsMajor2 = [];
//   this.rectsBackground = [];
//   this.selectedMsec = new Date().getTime();
//   this.intervalMsec = INTERVAL_HOUR_1;
// };

// app:timelineColorPointer="#c62828"
// app:timelineColorSelected1="#ffca28"
// app:timelineColorSelected2="#be8e00"
// app:timelineColorMajor1="#1DE9B6"
// app:timelineColorMajor2="#FF6D00"
// app:timelineColorBackground="#2e484b"
// app:timelineColorNoData="#2b2b2b"/>
function Timeline(options) {
    // console.log("Timeline()");
    var date = new Date();
    if (options) {
        this.options = options;
    } else {
        var defaultOptions = {
            timelines: 1,
            colorTimeBackground: "#C62828",
            colorTimeText: "#FFFFFF",
        };
        this.options = defaultOptions;
    }
    this.resetRects();
    this.timelineSelected = 0;
    this.selectedMsec = date.getTime();// - INTERVAL_HOUR_1 / 2;
    this.intervalMsec = INTERVAL_HOUR_1;
    this.gmtOffsetInMillis = -date.getTimezoneOffset() * 60000;
    this.density = 1;
    this.requestMoreBackgroundDataCallback = null;
    this.requestMoreMajor1DataCallback = null;
    this.requestMoreMajor2DataCallback = null;
    this.timeSelectedCallback = null;
    this.liveCallback = null;
    this.timerSelectedId = -1;
    this.isLive = false;
    this.recordsMajor1 = new Array(this.options.timelines);
    this.recordsMajor2 = new Array(this.options.timelines);
    this.recordsBackground = new Array(this.options.timelines);
    this.rectNoData = new Array(this.options.timelines);
    for (var i = 0; i < this.options.timelines; i++) {
        this.recordsMajor1[i] = [];
        this.recordsMajor2[i] = [];
        this.recordsBackground[i] = [];
        this.rectNoData[i] = null;
    }
}

Timeline.prototype.setCurrentTimeline = function(timelineIndex) {
  // console.log("setCurrentTimeline(timelineIndex=" + timelineIndex + ")");
  if (timelineIndex < this.options.timelines && timelineIndex >= 0)
    this.timelineSelected = timelineIndex;
};

Timeline.prototype.getCurrentTimeline = function() {
  return this.timelineSelected;
};

Timeline.prototype.getTotalTimelines = function() {
  return this.options.timelines;
};

Timeline.prototype.setCurrent = function(selectedMsec) {
  // console.log("setCurrent(selectedMsec=" + selectedMsec + ")");
  this.selectedMsec = Math.min(selectedMsec, new Date().getTime());
};

Timeline.prototype.getCurrent = function() {
  return this.selectedMsec;
};

Timeline.prototype.setCurrentWithAnimation = function(selectedMsec) {
  // console.log("setCurrentWithAnimation(selectedMsec=" + selectedMsec + ")");
  var newCurrentMsec = this.selectedMsec;
  var self = this;
  const REPEAT_MSEC = 10;
  const ANIMATION_DURATION_MSEC = 150;
  const delta = (this.selectedMsec - selectedMsec) / (ANIMATION_DURATION_MSEC / REPEAT_MSEC);

  var timerId = setInterval(function() {
    newCurrentMsec -= delta;
    // console.log("newCurrentMsec: " + newCurrentMsec);
    self.setCurrent(newCurrentMsec);
    self.draw();
  }, REPEAT_MSEC);

  setTimeout(function() {
    clearInterval(timerId);
    // console.log("newCurrentMsec: " + selectedMsec);
    self.setCurrent(selectedMsec);
    self.draw();
  }, ANIMATION_DURATION_MSEC);
};

Timeline.prototype.setCanvas = function(canvas) {
  // console.log("setCanvas()");
  this.canvas = canvas;
};

Timeline.prototype.setMajor1Records = function(timelineIndex, data) {
  // console.log("setMajor1Records(timelineIndex=" + timelineIndex + ") length=" + data.length);
  if (timelineIndex > this.options.timelines - 1)
    console.error('Out of index [' + timelineIndex + '/' + (this.options.timelines - 1) + '] on setMajor1Records()');
  else
    this.recordsMajor1[timelineIndex] = data;
}

Timeline.prototype.getMajor1Records = function(timelineIndex) {
  // console.log("getMajor1Records()");
  return this.recordsMajor1[timelineIndex];
}

Timeline.prototype.setMajor2Records = function(timelineIndex, data) {
  // console.log("setMajor2Records(timelineIndex=" + timelineIndex + ")");
  if (timelineIndex > this.options.timelines - 1)
    console.error('Out of index [' + timelineIndex + '/' + (this.options.timelines - 1) + '] on setMajor2Records()');
  else
    this.recordsMajor2[timelineIndex] = data;
}

Timeline.prototype.getMajor2Records = function(timelineIndex) {
  // console.log("getMajor2Records()");
  return this.recordsMajor2[timelineIndex];
}

Timeline.prototype.setBackgroundRecords = function(timelineIndex, data) {
  // console.log("setBackgroundRecords(timelineIndex=" + timelineIndex + ") length=" + data.length);
  if (timelineIndex > this.options.timelines - 1)
    console.error('Out of index [' + timelineIndex + '/' + (this.options.timelines - 1) + '] on setBackgroundRecords()');
  else
    this.recordsBackground[timelineIndex] = data;
}

Timeline.prototype.getBackgroundRecords = function(timelineIndex) {
  // console.log("getBackgroundRecords()");
  return this.recordsBackground[timelineIndex];
}

Timeline.prototype.setRequestMoreBackgroundDataCallback = function(callback) {
  // console.log("setRequestMoreBackgroundDataCallback()");
  this.requestMoreBackgroundDataCallback = callback;
}

Timeline.prototype.setRequestMoreMajor1DataCallback = function(callback) {
  // console.log("setRequestMoreMajor1DataCallback()");
  this.requestMoreMajor1DataCallback = callback;
}

Timeline.prototype.setRequestMoreMajor2DataCallback = function(callback) {
  // console.log("setRequestMoreMajor2DataCallback()");
  this.requestMoreMajor2DataCallback = callback;
}

Timeline.prototype.setTimeSelectedCallback = function(callback) {
  // console.log("setTimeSelectedCallback()");
  this.timeSelectedCallback = callback;
}

Timeline.prototype.setLiveCallback = function(callback) {
  // console.log("setLiveCallback()");
  this.liveCallback = callback;
}

Timeline.prototype.runTimeSelectedCallbackDelayed = function() {
  var self = this;
  clearTimeout(this.timerSelectedId);
  this.timerSelectedId = setTimeout(function() {
    let timelineIndex = self.getCurrentTimeline();
    var record = self.getRecord(self.selectedMsec, self.recordsBackground[timelineIndex]);
    self.timeSelectedCallback(timelineIndex, self.selectedMsec, record);
  }, 500);
}

Timeline.prototype.getNextRecord = function(currentMsec, records) {
  // console.log("getNextRecord()");
  var prevRecord = null;
  // Suppose all events sorted
  for (record of records) {
    if (prevRecord != null &&
      currentMsec < prevRecord.timestampMsec &&
      currentMsec >= record.timestampMsec) {

      return prevRecord;
    }
    prevRecord = record;
  }
  return null;
}

Timeline.prototype.getPrevRecord = function(currentMsec, records) {
  // console.log("getPrevRecord()");
  // Suppose all events sorted
  for (record of records) {
    if (record.timestampMsec < currentMsec)
        return record;
  }
  return null;
}

Timeline.prototype.getRecord = function(timestampMsec, records) {
  for (record of records) {
    if (timestampMsec >= record.timestampMsec &&
        timestampMsec < (record.timestampMsec + record.durationMsec)) {
        return record;
    }
  }
  return null;
}

Timeline.prototype.getNextMajorRecord = function(timelineIndex) {
  return this.getNextRecord(
      this.selectedMsec,
      this.recordsMajor1[timelineIndex]);
}

Timeline.prototype.getPrevMajorRecord = function(timelineIndex) {
  return this.getPrevRecord(
      this.selectedMsec - 30000 /*magic constant, 30 sec*/,
      this.recordsMajor1[timelineIndex]);
}

// https://www.html5rocks.com/en/tutorials/canvas/hidpi/
function updateCanvasDpi(context, canvas) {
  // console.log("updateCanvasDpi()");
  devicePixelRatio = window.devicePixelRatio || 1,
  backingStoreRatio = context.webkitBackingStorePixelRatio ||
                      context.mozBackingStorePixelRatio ||
                      context.msBackingStorePixelRatio ||
                      context.oBackingStorePixelRatio ||
                      context.backingStorePixelRatio || 1,

  ratio = devicePixelRatio / backingStoreRatio;

  // ensure we have a value set for auto.
  // If auto is set to false then we
  // will simply not upscale the canvas
  // and the default behaviour will be maintained
  if (typeof auto === 'undefined') {
    auto = true;
  }

  // upscale the canvas if the two ratios don't match
  if (auto && devicePixelRatio !== backingStoreRatio) {
    var oldWidth = canvas.width;
    var oldHeight = canvas.height;

    canvas.width = oldWidth * ratio;
    canvas.height = oldHeight * ratio;

    canvas.style.width = oldWidth + 'px';
    canvas.style.height = oldHeight + 'px';

    // now scale the context to counter
    // the fact that we've manually scaled
    // our canvas element
    context.scale(ratio, ratio);
  }
}

Timeline.prototype.setIntervalWithAnimation = function(interval) {
  // console.log("setIntervalWithAnimation(interval=" + interval + ")");
  var newIntervalMsec = this.intervalMsec;
  var self = this;
  const REPEAT_MSEC = 10;
  const ANIMATION_DURATION_MSEC = 150;
  const delta = (this.intervalMsec - interval) / (ANIMATION_DURATION_MSEC / REPEAT_MSEC);

  var timerId = setInterval(function() {
    newIntervalMsec -= delta;
    // console.log("newCurrentMsec: " + newCurrentMsec);
    self.intervalMsec = newIntervalMsec;
    self.draw();
  }, REPEAT_MSEC);

  setTimeout(function() {
    clearInterval(timerId);
    // console.log("newCurrentMsec: " + selectedMsec);
    self.intervalMsec = interval;
    self.draw();
  }, ANIMATION_DURATION_MSEC);
}

Timeline.prototype.getInterval = function() {
    return this.intervalMsec;
}

Timeline.prototype.increaseInterval = function() {
  // console.log("increaseInterval()");
  if (this.intervalMsec > INTERVAL_DAY_1 - 1) {
    this.setIntervalWithAnimation(INTERVAL_DAY_7);
  } else if (this.intervalMsec  > INTERVAL_HOUR_12 - 1) {
    this.setIntervalWithAnimation(INTERVAL_DAY_1);
  } else if (this.intervalMsec  > INTERVAL_HOUR_6 - 1) {
    this.setIntervalWithAnimation(INTERVAL_HOUR_12);
  } else if (this.intervalMsec  > INTERVAL_HOUR_1 - 1) {
    this.setIntervalWithAnimation(INTERVAL_HOUR_6);
  } else if (this.intervalMsec  > INTERVAL_MIN_30 - 1) {
    this.setIntervalWithAnimation(INTERVAL_HOUR_1);
  } else if (this.intervalMsec  > INTERVAL_MIN_15 - 1) {
    this.setIntervalWithAnimation(INTERVAL_MIN_30);
  } else if (this.intervalMsec  > INTERVAL_MIN_5 - 1) {
    this.setIntervalWithAnimation(INTERVAL_MIN_15);
  } else if (this.intervalMsec  > INTERVAL_MIN_1 - 1) {
    this.setIntervalWithAnimation(INTERVAL_MIN_5);
  } else {
    this.setIntervalWithAnimation(INTERVAL_MIN_1);
  }
}

Timeline.prototype.decreaseInterval = function() {
  // console.log("decreaseInterval()");
  if (this.intervalMsec > INTERVAL_DAY_7 - 1) {
    this.setIntervalWithAnimation(INTERVAL_DAY_1);
  } else if (this.intervalMsec > INTERVAL_DAY_1 - 1) {
    this.setIntervalWithAnimation(INTERVAL_HOUR_12);
  } else if (this.intervalMsec > INTERVAL_HOUR_12 - 1) {
    this.setIntervalWithAnimation(INTERVAL_HOUR_6);
  } else if (this.intervalMsec > INTERVAL_HOUR_6 - 1) {
    this.setIntervalWithAnimation(INTERVAL_HOUR_1);
  } else if (this.intervalMsec > INTERVAL_HOUR_1 - 1) {
    this.setIntervalWithAnimation(INTERVAL_MIN_30);
  } else if (this.intervalMsec > INTERVAL_MIN_30 - 1) {
    this.setIntervalWithAnimation(INTERVAL_MIN_15);
  } else if (this.intervalMsec > INTERVAL_MIN_15 - 1) {
    this.setIntervalWithAnimation(INTERVAL_MIN_5);
  } else if (this.intervalMsec > INTERVAL_MIN_5 - 1) {
    this.setIntervalWithAnimation(INTERVAL_MIN_1);
  }
}

Timeline.prototype.resetRects = function() {
  this.rectMajor1Selected = null;
  this.rectMajor2Selected = null;
  this.rectsMajor1 = new Array(this.options.timelines);
  this.rectsMajor2 = new Array(this.options.timelines);
  this.rectsBackground = new Array(this.options.timelines);
  for (var i = 0; i < this.options.timelines; i++) {
    this.rectsMajor1[i] = [];
    this.rectsMajor2[i] = [];
    this.rectsBackground[i] = [];
  }
}

// Update all rects used for drawing.
Timeline.prototype.updateRects = function(timelineIndex) {
  // console.log("updateRects(timelineIndex=" + timelineIndex + ")");

  var isLandscape = false;

  var offsetTopBottom = OFFSET_TOP_BOTTOM * this.density;
  var width = this.canvas.clientWidth;
  var height = (this.canvas.clientHeight - offsetTopBottom * 2) / this.options.timelines;
  var top = height * timelineIndex + offsetTopBottom;
  var minValue = this.selectedMsec - this.intervalMsec / 2;
  var maxValue = this.selectedMsec + this.intervalMsec / 2;
  var msecInPixels = width / this.intervalMsec;

  var offsetBackground = 2.0;//((isLandscape ? 2.6 : 3.4) * offsetTopBottom);
  var offsetMajor1     = offsetBackground;//((isLandscape ? 2.6 : 3.4) * offsetTopBottom);
  var offsetMajor2     = 4.0;//((isLandscape ? 3.0 : 4.0) * offsetTopBottom);

  // console.log("width: " + width + ", height: " + height + ", top: " + top + ", offsetBackground: " + offsetBackground);

  this.rectNoData[timelineIndex] = new Rect(
          0, // left
          offsetMajor1 + top, // top
          Math.min((new Date().getTime() - minValue) * msecInPixels, width), // right
          height - offsetMajor1 * 2); // bottom

  for (record of this.recordsMajor1[timelineIndex]) {
    if ((record.timestampMsec + record.durationMsec) >= minValue &&
        (record.timestampMsec) <= maxValue) {

      var rect = new Rect(
          Math.max((record.timestampMsec - minValue) * msecInPixels, 0), // left
          offsetMajor1 + top, // top
          Math.min((record.timestampMsec - minValue + record.durationMsec) * msecInPixels, width), // right
          height - offsetMajor1 * 2); // bottom

      // Draw at least 1px width
      if (rect.right - rect.left < 1)
         rect.right += 1;

      if (this.rectMajor1Selected == null &&
          timelineIndex == this.timelineSelected &&
          this.selectedMsec >= record.timestampMsec &&
          this.selectedMsec < (record.timestampMsec + record.durationMsec)) {

        this.rectMajor1Selected = rect;
      } else {
        this.rectsMajor1[timelineIndex].push(rect);
      }
    //  console.log("[" + record.timestampMsec + ", " + record.durationMsec + "] ms -> [" +
    //              rect.left.toFixed(1) + ", " + rect.right.toFixed(1) + "] px");
    // } else {
    //   console.log("Skipped");
    }
  }
  // Check if we need more older records to load
  if (this.recordsMajor1[timelineIndex].length > 0) {
      // Get the last record (oldest one)
      var record = this.recordsMajor1[timelineIndex][this.recordsMajor1[timelineIndex].length - 1];
      if (minValue < record.timestampMsec && this.requestMoreMajor1DataCallback != null) {
          this.requestMoreMajor1DataCallback(timelineIndex);
      }
  // } else {
  //     console.log("timelineIndex=" + timelineIndex + " length is 0.");
  }

  for (record of this.recordsMajor2[timelineIndex]) {
    if ((record.timestampMsec + record.durationMsec) >= minValue &&
        (record.timestampMsec) <= maxValue) {

      var rect = new Rect(
          Math.max((record.timestampMsec - minValue) * msecInPixels, 0), // left
          offsetMajor2 + top, // top
          Math.min((record.timestampMsec - minValue + record.durationMsec) * msecInPixels, width), // right
          height - offsetMajor2 * 2); // bottom

      if (this.rectMajor2Selected == null &&
          timelineIndex == this.timelineSelected &&
          this.selectedMsec >= record.timestampMsec &&
          this.selectedMsec < (record.timestampMsec + record.durationMsec)) {

        this.rectMajor2Selected = rect;
      } else {
        this.rectsMajor2[timelineIndex].push(rect);
      }
      // console.log("[" + record.timestampMsec + ", " + record.durationMsec + "] ms -> [" +
      //             rect.left.toFixed(1) + ", " + rect.right.toFixed(1) + "] px");
    // } else {
    //   console.log("Skipped");
    }
  }
  // Check if we need more older records to load
  if (this.recordsMajor2[timelineIndex].length > 0) {
      // Get the last record (oldest one)
      var record = this.recordsMajor2[timelineIndex][this.recordsMajor2[timelineIndex].length - 1];
      if (minValue < record.timestampMsec && this.requestMoreMajor2DataCallback != null) {
          this.requestMoreMajor2DataCallback(timelineIndex);
      }
  }

  for (record of this.recordsBackground[timelineIndex]) {
    if ((record.timestampMsec + record.durationMsec) >= minValue &&
        (record.timestampMsec) <= maxValue) {

      var rect = new Rect(
          Math.max((record.timestampMsec - minValue) * msecInPixels, 0), // left
          offsetBackground + top, // top
          Math.min((record.timestampMsec - minValue + record.durationMsec) * msecInPixels, width), // right
          height - offsetBackground * 2); // bottom

      if (rect.right - rect.left < 1)
         rect.right += 1;
      this.rectsBackground[timelineIndex].push(rect);
    }
    // // Skip processing not shown older records
    // if (minValue > record.timestampMsec) {
    //   break;
    // }
  }

  // Check if we need more older records to load
  if (this.recordsBackground[timelineIndex].length > 0) {
    // Get the last record (oldest one)
    var record = this.recordsBackground[timelineIndex][this.recordsBackground[timelineIndex].length - 1];
    if (minValue < record.timestampMsec && this.requestMoreBackgroundDataCallback != null) {
      this.requestMoreBackgroundDataCallback(timelineIndex);
    }
  }
}

Timeline.prototype.updateResize = function() {
  var context = this.canvas.getContext('2d');
  updateCanvasDpi(context, this.canvas);
}

function msToTime(s) {
  var ms = s % 1000;
  s = (s - ms) / 1000;
  var secs = s % 60;
  s = (s - secs) / 60;
  var mins = s % 60;
  var hrs = (s - mins) / 60;

  return hrs + ':' + mins + ':' + secs + '.' + ms;
}

function isToday(date) {
  var today = new Date();
  return today.toDateString() == date.toDateString();
}

Timeline.prototype.drawCurrentTimeDate = function(context) {
  context.save();
  var date = new Date();
  date.setTime(this.selectedMsec);

  var now = new Date().getTime();
  let isNow = false;
  if (new Date().getTime() - this.selectedMsec < 1000) {
      isNow = true;
  } else {
      isNow = false;
  }

  // Draw time
  context.font = "12px sans-serif";
  let isLive = isNow && this.liveCallback != null;
  if (isLive || this.isLive)
      this.liveCallback(this.timelineSelected, isLive);
  this.isLive = isLive;
  var text = isLive ? "LIVE" : (isNow ? "Now" : date.formatDateHourMinSec());
  var textWidth = context.measureText(text).width;
  var textHeight = 12;
  var textX = this.canvas.clientWidth / 2 - textWidth / 2;
  context.fillStyle = this.options.colorTimeBackground;
  context.fillRect(textX - 2, 0, textWidth + 4, textHeight + 6);
  context.fillStyle = this.options.colorTimeText;
  context.fillText(text, textX, textHeight + 2);

  // Draw date
  text = isToday(date) ? "Today" : date.toLocaleDateString();
  textWidth = context.measureText(text).width;
  textX = this.canvas.clientWidth - textWidth - 4;
  context.fillText(text, textX, textHeight + 2);

  context.restore();
}

Timeline.prototype.getRulerScale = function() {
    if (this.intervalMsec > INTERVAL_DAY_7 - 1) {
        return "7 days";
    }  else if (this.intervalMsec > INTERVAL_DAY_1 - 1) {
        return "1 day";
    } else if (this.intervalMsec > INTERVAL_HOUR_12 - 1) {
        return "12 hours";
    } else if (this.intervalMsec > INTERVAL_HOUR_6 - 1) {
        return "6 hours";
    } else if (this.intervalMsec > INTERVAL_HOUR_1 - 1) {
        return "1 hour";
    } else if (this.intervalMsec > INTERVAL_MIN_30 - 1) {
        return "30 min";
    } else if (this.intervalMsec > INTERVAL_MIN_15 - 1) {
        return "15 min";
    } else if (this.intervalMsec > INTERVAL_MIN_5 - 1) {
        return "5 min";
    } else if (this.intervalMsec > INTERVAL_MIN_1 - 1) {
        return "1 min";
    } else {
        return "";
    }
}

Date.prototype.formatDateHourMin = function() {
  var hours = this.getHours();
  var min = this.getMinutes();
  var text =
    (hours < 10 ? "0" : "") + hours + ":" +
    (min < 10 ? "0" : "") + min;
  return text;
}

Date.prototype.formatDateHourMinSec = function() {
  var hours = this.getHours();
  var min = this.getMinutes();
  var sec = this.getSeconds();
  var text =
    (hours < 10 ? "0" : "") + hours + ":" +
    (min < 10 ? "0" : "") + min + ":" +
    (sec < 10 ? "0" : "") + sec;
  return text;
}

Date.prototype.formatShortDate = function() {
  var month = this.toLocaleString("en-us", { month: "short" });
  var day = this.getDate();
  var text = month + " " + day;
  return text;
}

Timeline.prototype.drawHoursMinutes = function(context, msecInPixels, interval) {
  var minValue = this.selectedMsec - this.intervalMsec / 2 + this.gmtOffsetInMillis;
  var maxValue = this.selectedMsec + this.intervalMsec / 2 + this.gmtOffsetInMillis;
  if (minValue + this.selectedMsec % interval < maxValue) {
    // Number of hours to be drawn
    var numToDraw = this.intervalMsec / interval;
    var offsetInterval = minValue % interval;
    // Check that we can draw not overlaid hour:min.
    var textWidth = context.measureText("__00:00__").width;
    if (numToDraw * textWidth < this.canvas.clientWidth) {
      var offsetInPixels = offsetInterval * msecInPixels;
      var curIntervalInPixels = this.intervalMsec * msecInPixels;
      var intervalInPixels = interval * msecInPixels;
      var height = this.canvas.clientHeight;
      var offsetTopBottom = OFFSET_TOP_BOTTOM * this.density;

      context.fillStyle = this.options.colorDigits;
      context.strokeStyle = this.options.colorDigits;
      // 12:00  13:00  14:00  15:00  16:00
      //   |  .   |   .  |   .  |   .  |
      context.save();
      context.beginPath();
      for (var i = 0; i < numToDraw; i++) {
        var startDate = new Date();
        startDate.setTime(minValue - offsetInterval + (i + 1) * interval - this.gmtOffsetInMillis);
        var text = startDate.formatDateHourMin(); // "HH:mm"
        // // Show "Nov 1" instead of "00:00"
        if ("00:00" === text) {
          text = startDate.formatShortDate();
          // context.style.fontWeight = "bold";
          context.font = "bold 10px sans-serif";
          // context.fillStyle = "#c62828";
        } else {
          context.font = "10px sans-serif";
        }

        var x = curIntervalInPixels - (offsetInPixels + (numToDraw - i - 1) * intervalInPixels);
        // Draw "12:00"

        textWidth = context.measureText(text).width;
        context.fillText(text, x - textWidth / 2, height - offsetTopBottom / 1.7);

        // Draw ruler
        // 12:00
        //   |
        context.moveTo(x, height - offsetTopBottom / 5);
        context.lineTo(x, height - offsetTopBottom / 2.5);

        //
        //   .
        x -= intervalInPixels / 2;
        if (x > 0) {
          context.moveTo(x, height - offsetTopBottom / 5);
          context.lineTo(x, height - offsetTopBottom / 4);
          // context.moveTo(x, height - offsetTopBottom / 1.5);
          // context.lineTo(x, height - offsetTopBottom / 2);
        }

        if (i == numToDraw - 1)
            x += intervalInPixels;

        // context.moveTo(x, height - offsetTopBottom / 1.5);
        // context.lineTo(x, height - offsetTopBottom / 2);
      }
      context.stroke();
      context.restore();
      return true;
    }
  }
}

Timeline.prototype.drawRuler = function(context) {
  var msecInPixels = this.canvas.clientWidth / this.intervalMsec;
  // Draw every minute
  if (!this.drawHoursMinutes(context, msecInPixels, INTERVAL_MIN_1))
    // Draw every 5 minutes
    if (!this.drawHoursMinutes(context, msecInPixels, INTERVAL_MIN_5))
      // Draw every 15 minutes
      if (!this.drawHoursMinutes(context, msecInPixels, INTERVAL_MIN_15))
        // Draw every 30 minutes
        if (!this.drawHoursMinutes(context, msecInPixels, INTERVAL_MIN_30))
          // Draw every hour
          if (!this.drawHoursMinutes(context, msecInPixels, INTERVAL_HOUR_1))
            // Draw every 6 hours
            if (!this.drawHoursMinutes(context, msecInPixels, INTERVAL_HOUR_6))
              // Draw every 12 hours
              if (!this.drawHoursMinutes(context, msecInPixels, INTERVAL_HOUR_12))
                // Draw every 24 hours
                this.drawHoursMinutes(context, msecInPixels, INTERVAL_DAY_1);

  // Draw ruler scale, e.g. "5 days", "30 min"
  var textScale = this.getRulerScale();
  var textWidth = context.measureText(textScale).width;
  var textHeight = 10;
  context.fillStyle = this.options.colorDigits;
  context.fillText(textScale, 4, textHeight + 2);
}

Timeline.prototype.onSingleTapUp = function(mouseEvent) {
  // console.log("onSingleTapUp(x=" + mouseEvent.offsetX + ")");
  var offsetXInPixels = mouseEvent.offsetX - this.canvas.clientWidth / 2.0;
  var msecXInPixels = this.intervalMsec / this.canvas.clientWidth;
  var offsetXInMsec = msecXInPixels * offsetXInPixels;

  // var timelineChanged = false;
  if (this.options.timelines > 0) {
    // Detect if y belongs to any of timeline
    var y = mouseEvent.offsetY - OFFSET_TOP_BOTTOM;
    if (y > 0 && mouseEvent.offsetY < this.canvas.clientHeight - OFFSET_TOP_BOTTOM) {
      // Detect which timeline selected
      var timelineHeight = (this.canvas.clientHeight - OFFSET_TOP_BOTTOM * 2) / this.options.timelines;
      var timelineIndex = Math.floor(y / timelineHeight);
      // console.log('Y: ' + y + ', height: ' + timelineHeight + ", timelineIndex: " + timelineIndex);
      if (this.timelineSelected != timelineIndex) {
        this.timelineSelected = timelineIndex;
        // timelineChanged = true;
        // this.draw();
        // return;
      }
    }
  }

  // Search if clicked on major2 record first
  var newSelectedXMsec = this.selectedMsec + offsetXInMsec;
  var foundMajor2 = false;
  // if (!timelineChanged) {
  for (record of this.recordsMajor2[this.timelineSelected]) {
    // On event clicked. Search for the beginning of the event.
    if (newSelectedXMsec >= record.timestampMsec &&
        newSelectedXMsec <= (record.timestampMsec + record.durationMsec)) {

      newSelectedXMsec = record.timestampMsec;
      foundMajor2 = true;
      break;
    }
  }
  // }

  // Search if clicked on major1 record or between major1 records
  if (!foundMajor2 /*&& !timelineChanged*/) {
    var prevRecord = null;
    for (record of this.recordsMajor1[this.timelineSelected]) {
      // On event clicked. Search for the beginning of the event.
      if (newSelectedXMsec >= record.timestampMsec &&
          newSelectedXMsec <= (record.timestampMsec + record.durationMsec)) {

        newSelectedXMsec = record.timestampMsec;
        break;

      // On space clicked. Search for the next event.
      } else if (prevRecord != null &&
              newSelectedXMsec > (record.timestampMsec + record.durationMsec) &&
              newSelectedXMsec < prevRecord.timestampMsec) {

        newSelectedXMsec = prevRecord.timestampMsec;
        break;
      }
      prevRecord = record;
    }
  }
  this.setCurrentWithAnimation(newSelectedXMsec);
  this.draw();
  this.runTimeSelectedCallbackDelayed();
}

Timeline.prototype.onScroll = function(deltaX) {
  // console.log("onScroll(deltaX=" + deltaX + ")");
  var msecInPixels = this.intervalMsec / this.canvas.clientWidth;
  var offsetInMsec = 0;
  offsetInMsec = msecInPixels * deltaX;
  this.setCurrent(this.getCurrent() - offsetInMsec);
  this.draw();
  this.runTimeSelectedCallbackDelayed();
}

// Main drawing function
Timeline.prototype.draw = function() {
  // console.log("draw()");
  this.resetRects();
  for (var i = 0; i < this.options.timelines; i++) {
    this.updateRects(i);
  }
  var context = this.canvas.getContext('2d');
  // updateCanvasDpi(context, this.canvas);

  dimensions = { top: 0, left: 0, width: this.canvas.clientWidth, height: this.canvas.clientHeight };

  // Draw background
  context.fillStyle = this.options.colorBackground;
  context.fillRect(0, 0, dimensions.width, dimensions.height);

  // Draw
  for (var i = 0; i < this.options.timelines; i++) {
    // Draw selected timeline if there are multiple timelines available
    if (this.options.timelines > 1 && i == this.timelineSelected) {
      context.fillStyle = this.options.colorTimelineSelected;
      context.fillRect(
          this.rectNoData[i].left - 2,
          this.rectNoData[i].top - 2,
          this.rectNoData[i].right - this.rectNoData[i].left + 4,
          this.rectNoData[i].bottom + 4);
    }

    // Draw empty timeline
    context.fillStyle = this.options.colorRectNoData;
    context.fillRect(
        this.rectNoData[i].left,
        this.rectNoData[i].top,
        this.rectNoData[i].right - this.rectNoData[i].left,
        this.rectNoData[i].bottom);

    // Draw rects background
    context.fillStyle = this.options.colorRectBackground;
    for (rect of this.rectsBackground[i]) {
      context.fillRect(
          rect.left,
          rect.top,
          rect.right - rect.left,
          rect.bottom);
    }

    // Draw rects major1
    context.fillStyle = this.options.colorRectMajor1;
    for (rect of this.rectsMajor1[i]) {
      context.fillRect(
          rect.left,
          rect.top,
          rect.right - rect.left,
          rect.bottom);
    }

    // Draw currently selected rectangle
    if (this.rectMajor1Selected != null) {
      context.fillStyle = this.options.colorMajor1Selected;
      context.fillRect(
          this.rectMajor1Selected.left,
          this.rectMajor1Selected.top,
          this.rectMajor1Selected.right - this.rectMajor1Selected.left,
          this.rectMajor1Selected.bottom);
    }

    // Draw rects major2
    context.fillStyle = this.options.colorRectMajor2;
    for (rect of this.rectsMajor2[i]) {
      context.fillRect(
          rect.left,
          rect.top,
          rect.right - rect.left,
          rect.bottom);
    }

    if (this.rectMajor2Selected != null) {
      context.fillStyle = this.options.colorMajor2Selected;
      context.fillRect(
          this.rectMajor2Selected.left,
          this.rectMajor2Selected.top,
          this.rectMajor2Selected.right - this.rectMajor2Selected.left,
          this.rectMajor2Selected.bottom);
    }

    // Draw selected time
    context.fillStyle = this.options.colorTimeBackground;
    context.fillRect(
        this.canvas.clientWidth / 2,
        0,
        2,
        this.canvas.clientHeight);

    // Draw timeline names
    if (this.options.timelineNames != null && i < this.options.timelineNames.length) {
      let textHeight = 12;

      if (this.options.timelines > 1 && i == this.timelineSelected) {
        context.fillStyle = this.options.colorTimelineSelected;
        context.globalAlpha = 0.9;
      } else {
        context.fillStyle = this.options.colorBackground;
        context.globalAlpha = 0.6;
      }

      var textWidth = context.measureText(this.options.timelineNames[i]).width;
      var textX = 4;
      var textY = this.rectNoData[i].top + this.rectNoData[i].bottom / 2 + textHeight / 2;
      context.fillRect(textX - 2, textY - textHeight, textWidth + 4, textHeight + 6);
      context.globalAlpha = 1.0;

      context.fillStyle = this.options.colorTimeText;
      context.fillText(
          this.options.timelineNames[i],
          textX,
          textY);
    }


    this.drawRuler(context);
    this.drawCurrentTimeDate(context);
  } // for
}

// export { Timeline, TimeRecord };
// export { INTERVAL_MIN_1, INTERVAL_MIN_5, INTERVAL_MIN_15, INTERVAL_MIN_30, INTERVAL_HOUR_1, INTERVAL_HOUR_6, INTERVAL_HOUR_12, INTERVAL_DAY_1, INTERVAL_DAY_7 };
