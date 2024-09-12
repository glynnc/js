"use strict";

function clock()
{
    this.hour_24 = true;
    this.blink = true;

    this.last = [null,null,null,null];
    this.dots_on = true;
}

clock.prototype = new Object;

clock.prototype.set_digit = function(which, value)
{
    for (var i = 0; i < 10; i++) {
	var element = document.getElementById("digit_" + which + "_" + i);
	element.style.setProperty("display", value == i ? "" : "none");
    }
};

clock.prototype.update = function()
{
    var time = new Date();

    var m = time.getMinutes();
    var h = time.getHours();
    if (!this.hour_24) {
	h %= 12;
	if (h == 0)
	    h = 12;
    }

    var digits = [m % 10, Math.floor(m / 10),
		  h % 10, Math.floor(h / 10)];

    for (var i = 0; i < digits.length; i++)
	if (digits[i] != this.last[i])
	    this.set_digit(i, digits[i]);

    this.last = digits;

    if (!this.blink)
	return;

    var millis = time.getMilliseconds();
    var on = millis < 500;

    if (on != this.dots_on) {
	var element = document.getElementById("ref_dp");
	//element.style.setProperty("fill", on ? "#ff0000" : "none");
	element.style.setProperty("display", on ? "" : "none");
    }

    this.dots_on = on;
};

clock.prototype.start = function()
{
    window.setInterval(this.update.bind(this), 100);
};

var the_clock = null;

function startup()
{
    the_clock = new clock;
    the_clock.start();
}

