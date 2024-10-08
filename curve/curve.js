"use strict";

var svg_ns = "http://www.w3.org/2000/svg";

function Calculator()
{
    this.init();
}

Calculator.prototype = new Object;

Calculator.prototype.solve = function(r)
{
    var t0 = Math.sqrt((6*Math.sqrt(70*r-45)-30)/7);
    // solve for t: t/sin(t) = r
    // f(t) = t/sin(t)-r
    // f'(t) = (sin(t)-t*cos(t))/sin^2(t)
    var t = t0;
    for (var i = 0; i < 5; i++) {
        var s = Math.sin(t);
        var c = Math.cos(t);
	t -= s*(t-r*s)/(s-t*c);
    }
    return t;
};

Calculator.prototype.calculate = function()
{
    var x = Number(this.in_x_t.value);
    var y = Number(this.in_y_t.value);
    if (y < x) {
        this.out_t.textContent = "X must be less than Y";
        return;
    }
    var q = y / x;
    var t = this.solve(q);
    var R = y / (2*t);
    this.out_t.textContent = "R=" + R.toFixed(2) + ", θ=" + (t*180/Math.PI).toFixed(2) + "°";
};

Calculator.prototype.init = function()
{
    this.in_x_t = document.getElementById("input_x");
    this.in_y_t = document.getElementById("input_y");
    this.out_t = document.getElementById("output");
};

var app = null;

function init()
{
    app = new Calculator();
}
