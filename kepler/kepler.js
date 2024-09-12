"use strict";

var svg_ns = "http://www.w3.org/2000/svg";

var minor_r = 120; // minor radius
var major_r = 150; // major radius
var epsilon = null; // eccentricity
var focus_x = null; // centre-focus distance

var run = false;
var start = null;
var start_angle = null;
var angle = 0.0;

var status_t = null;

var orbit = null;
var minor_c = null;
var major_c = null;

var focus = null;
var planet = null;

var ray_mean = null;
var ray_ecc = null;
var ray_abs = null;
var ray_vert = null;
var ray_horz = null;
var ray_dir = null;

function move_item(element, x, y)
{
    var xforms = element.transform.baseVal;
    xforms.clear();

    var move = document.documentElement.createSVGTransform();
    move.setTranslate(x, y);
    xforms.appendItem(move);
}

function move_line(element, x0, y0, x1, y1)
{
    var data = element.pathSegList;
    data.clear();
    data.appendItem(element.createSVGPathSegMovetoAbs(x0,y0));
    data.appendItem(element.createSVGPathSegLinetoAbs(x1,y1));
}

function size_ellipse(element, x, y)
{
    var data = element.pathSegList;
    data.clear();
    data.appendItem(element.createSVGPathSegMovetoAbs(x,0));
    data.appendItem(element.createSVGPathSegArcAbs(-x,0,x,y,0,true,true));
    data.appendItem(element.createSVGPathSegArcAbs( x,0,x,y,0,true,true));
    data.appendItem(element.createSVGPathSegClosePath());
}

function update()
{
    var M = angle % (2 * Math.PI);
    var E = M;
    // solve for E: E - epsilon * sin(E) = M
    // f(E) = E - epsilon * sin(E) - M
    // f'(E) = 1 - epsilon * cos(E)
    for (var i = 0; i < 5; i++)
	E -= (E - epsilon * Math.sin(E) - M) / (1 - epsilon * Math.cos(E));

    var xm =  major_r * Math.cos(M);
    var ym = -major_r * Math.sin(M);

    move_line(ray_mean, 0, 0, xm, ym);

    var x0 = minor_r * Math.cos(E);
    var x = major_r * Math.cos(E);
    var y = -minor_r * Math.sin(E);
    var y1 = -major_r * Math.sin(E);

    move_item(planet, x, y);

    move_line(ray_abs, 0, 0, x, y);
    move_line(ray_ecc, 0, 0, x, y1);
    move_line(ray_vert, x, y1, x, y);
    move_line(ray_horz, x0, y, x, y);
    move_line(ray_dir, focus_x, 0, x, y);

    // set_status('' + (E - epsilon * Math.sin(E) - M));
}

function draw(timestamp)
{
    // set_status("" + Math.round(start) + "," + Math.round(timestamp) + "," + Math.round(start_angle) + "," + Math.round(angle));
    if (start === null) {
	start = timestamp;
	start_angle = angle;
    }

    angle = start_angle + (timestamp - start) / 1000;
    update();

    if (run)
	window.requestAnimationFrame(draw);
    else
	start = null;
}

function toggle_run(evt)
{
    run = !run;
    if (run)
	window.requestAnimationFrame(draw);
}

function set_status(msg)
{
    var status = status_t;
    while (status.hasChildNodes())
	status.removeChild(status.firstChild);
//     for (var i = 0; i < status.childNodes.length; i++)
// 	status.removeChild(status.childNodes[i]);
    status.appendChild(document.createTextNode(msg));
}

function startup(evt)
{
    status_t = document.getElementById("status");

    orbit = document.getElementById("orbit");
    minor_c = document.getElementById("minor_circle");
    major_c = document.getElementById("major_circle");

    focus = document.getElementById("focus");
    planet = document.getElementById("planet");

    ray_mean = document.getElementById("ray_mean_anomaly");
    ray_ecc = document.getElementById("ray_ecc_anomaly");
    ray_abs = document.getElementById("ray_abs_anomaly");
    ray_vert = document.getElementById("ray_vertical");
    ray_horz = document.getElementById("ray_horizontal");
    ray_dir = document.getElementById("ray_direction");

    epsilon = Math.sqrt(1 - (minor_r * minor_r) / (major_r * major_r));
    focus_x = Math.sqrt(major_r * major_r - minor_r * minor_r);
    size_ellipse(orbit, major_r, minor_r);
    size_ellipse(minor_c, minor_r, minor_r);
    size_ellipse(major_c, major_r, major_r);
    move_item(focus, focus_x, 0);

    set_status('');

    document.documentElement.onmousedown = function () { toggle_run() };

    toggle_run(null);
}
