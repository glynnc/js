"use strict";

function clock()
{
    this.second_whole = true;
    this.minute_whole = false;
    this.hour_whole = false;

    this.e_hour   = document.getElementById("group_hour");
    this.e_minute = document.getElementById("group_minute");
    this.e_second = document.getElementById("group_second");

    this.origin = new Date();
    this.origin.setHours(0);
    this.origin.setMinutes(0);
    this.origin.setSeconds(0);

    this.last_secs = null;
}

clock.prototype = new Object;

clock.prototype.set_angle = function(element, angle)
{
    if (element == null)
	return;
    var xforms = element.transform.baseVal;
    xforms.clear();
    var xform = document.documentElement.createSVGTransform();
    xform.setRotate(-(angle % 360), 0, 0);
    xforms.appendItem(xform);
};

clock.prototype.update = function()
{
    var millis = Date.now() - this.origin.getTime();
    var secs = millis / 1e3;

    var hour   = secs / (60 * 60) % 12;
    var minute = secs / 60 % 60;
    var second = secs % 60;

    if (this.second_whole) {
	if (secs == this.last_secs)
	    return;
	this.last_secs = secs;
	second = Math.floor(second);
	if (this.minute_whole) {
	    minute = Math.floor(minute);
	    if (this.hour_whole)
		hour = Math.floor(hour);
	}
    }

    this.set_angle(this.e_hour  , hour   * 360 / 12);
    this.set_angle(this.e_minute, minute * 360 / 60);
    this.set_angle(this.e_second, second * 360 / 60);
};

clock.prototype.start = function()
{
    window.setInterval(this.update.bind(this), this.second_whole ? 100 : 33.333);
};

var the_clock = null;

function startup()
{
    the_clock = new clock;
    the_clock.start();
}

