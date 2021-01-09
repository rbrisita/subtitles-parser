var parser = (function () {
  var o = {};

  /**
   * Converts SubRip subtitles (SRT) into and array of objects
   * [{
   *     id:        `Number of subtitle`
   *     startTime: `Start time of subtitle`
   *     endTime:   `End time of subtitle
   *     text: `Text of subtitle`
   * }]
   *
   * @param  {String} data SRT subtitles string.
   * @param  {String} timeFormat Optional: Change startTime and endTime to either: milliseconds ('ms' ) or seconds ('s').
   * @return {Array} An array of cue objects consisting of: {id, startTime, endTime, text}.
   */
  o.fromSrt = function (data, timeFormat, isYoutubeAutoTranscript) {
    var useYoutubeAutoTranscript = isYoutubeAutoTranscript ? true : false;
    data = data.replace(/\r/g, "");
    var regex = /(\d+)?\n?(\d{2}:\d{2}:\d{2}[,.]\d{3}) --> (\d{2}:\d{2}:\d{2}[,.]\d{3}).*\n/g;
    data = data.split(regex);
    data.shift();
    var items = [];
    for (var i = 0; i < data.length; i += 4) {
      var text = data[i + 3];
      if (useYoutubeAutoTranscript) {
        text = text.split("\n");
        text.shift();
        text = text.join("\n");
      }
      if (text.trim().length === 0) continue;
      items.push({
        id: data[i] ? +data[i].trim() : items.length + 1,
        startTime: changeTimeFormat(data[i + 1].trim(), timeFormat),
        endTime: changeTimeFormat(data[i + 2].trim(), timeFormat),
        text: text.trim(),
      });
    }
    return items;
  };

  /**
   * Converts an array of cue objects into SRT subtitles string.
   * @param  {Array} data An array of cue objects consisting of: {id, startTime, endTime, text}.
   * @return {String} SRT subtitles string.
   */
  o.toSrt = function (data) {
    if (!data instanceof Array) return "";
    var res = "";

    for (var i = 0; i < data.length; i++) {
      var s = data[i];

      if (!isNaN(s.startTime) && !isNaN(s.endTime)) {
        s.startTime = o.msToSrt(parseInt(s.startTime, 10));
        s.endTime = o.msToSrt(parseInt(s.endTime, 10));
      }

      res += s.id + "\r\n";
      res += s.startTime + " --> " + s.endTime + "\r\n";
      res += s.text.replace("\n", "\r\n") + "\r\n\r\n";
    }

    return res;
  };

  var changeTimeFormat = function (time, format) {
    if (format === "ms") {
      return o.srtToMs(time);
    } else if (format === "s") {
      return o.srtToMs(time) / 1000;
    } else {
      return time;
    }
  };

  /**
   * Convert given SRT time string to milliseconds.
   * @param {String} val SRT time string.
   * @retrun {Number} A millisecond value representing given SRT string.
   */
  o.srtToMs = function (val) {
    var regex = /(\d+):(\d{2}):(\d{2})[,.](\d{3})/;
    var parts = regex.exec(val);

    if (parts === null) {
      return 0;
    }

    for (var i = 1; i < 5; i++) {
      parts[i] = parseInt(parts[i], 10);
      if (isNaN(parts[i])) parts[i] = 0;
    }

    // hours + minutes + seconds + ms
    return parts[1] * 3600000 + parts[2] * 60000 + parts[3] * 1000 + parts[4];
  };

  /**
   * Convert given ms to SRT time string.
   * @param {Number} val Time in milliseconds.
   * @return {String} SRT time string.
   */
  o.msToSrt = function (ms) {
    var measures = [3600000, 60000, 1000];
    var time = [];

    for (var i in measures) {
      var res = ((ms / measures[i]) >> 0).toString();

      if (res.length < 2) res = "0" + res;
      ms %= measures[i];
      time.push(res);
    }

    var ms = ms.toString();
    if (ms.length < 3) {
      for (i = 0; i <= 3 - ms.length; i++) ms = "0" + ms;
    }

    return time.join(":") + "," + ms;
  };

  return o;
})();

// ignore exports for browser
if (typeof exports === "object") {
  module.exports = parser;
}
