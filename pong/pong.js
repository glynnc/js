"use strict";

var xmlns="http://www.w3.org/2000/svg";

var e_svg    = null;
var e_bat_l  = null;
var e_bat_r  = null;
var e_ball   = null;
var e_pitch  = null;
var e_score  = null;
var e_digits = null;

var d_bat_l  = null;
var d_bat_r  = null;
var d_ball   = null;
var d_pitch  = null;

var last    = null;
var ball_x  = null;
var ball_y  = null;
var ball_dx = null;
var ball_dy = null;
var speed   = null;
var scores  = null;

function getBox(e)
{
    var box = {};
    box.x = e.x.baseVal.value;
    box.y = e.y.baseVal.value;
    box.w = e.width.baseVal.value;
    box.h = e.height.baseVal.value;
    return box;
}

function updatePos(box, e)
{
    box.x = e.x.baseVal.value;
    box.y = e.y.baseVal.value;
}

function update_score(which)
{
    var value = scores[which];
    if (value > 15)
	value = 15;
    var lo = value % 10;
    var hi = value >= 10;
    for (var i = 0; i < 10; i++)
	e_digits[which][i].style.setProperty("display", lo == i ? "" : "none");
    e_digits[which][10].style.setProperty("display", hi ? "" : "none");
}

function serve_l()
{
    ball_x = d_pitch.x + 10;
    ball_y = d_pitch.y + d_pitch.h / 2;
    ball_dx = 1;
    ball_dy = 1;
}

function serve_r()
{
    ball_x = d_pitch.x + d_pitch.w - 10;
    ball_y = d_pitch.y + d_pitch.h / 2;
    ball_dx = -1;
    ball_dy = 1;
}

function start()
{
    speed = 2;
    scores = [0, 0];
    update_score(0);
    update_score(1);
    serve_l();
}

function update()
{
    var now = Date.now() / 1e3;
    var delta = now - last;
    last = now;

    updatePos(d_ball , e_ball );
    updatePos(d_bat_l, e_bat_l);
    updatePos(d_bat_r, e_bat_r);

    ball_x += ball_dx * speed;
    ball_y += ball_dy * speed;
    var x = ball_x - d_ball.w / 2;
    var y = ball_y - d_ball.h / 2;
    e_ball.setAttribute("x", x);
    e_ball.setAttribute("y", y);

    var y = ball_y - d_bat_l.h / 2;
    e_bat_l.setAttribute("y", y);

    if (ball_dx > 0 && ball_x + d_ball.w/2 >= d_bat_r.x) {
	if (ball_y + d_ball.h/2 > d_bat_r.y && ball_y - d_ball.h/2 < d_bat_r.y + d_bat_r.h)
	    ball_dx = -1;
	else {
	    scores[0]++;
	    update_score(0);
	    serve_l();
	}
    }
    else if (ball_dx < 0 && ball_x - d_ball.w/2 <= d_bat_l.x + d_bat_l.w)
    {	if (ball_y + d_ball.h/2 > d_bat_l.y && ball_y - d_ball.h/2 < d_bat_l.y + d_bat_l.h)
	    ball_dx = 1;
	else {
	    scores[1]++;
	    update_score(1);
	    serve_r();
	}
    }

    if (ball_dy > 0 && ball_y + d_ball.h/2 >= d_pitch.y + d_pitch.h)
	ball_dy = -1;
    else if (ball_dy < 0 && ball_y - d_ball.h/2 <= d_pitch.y)
	ball_dy = 1;
}

function mousemove(event)
{
    event.preventDefault();

    var svgPoint = e_svg.createSVGPoint();
    svgPoint.x = event.clientX;
    svgPoint.y = event.clientY;
    svgPoint = svgPoint.matrixTransform(e_svg.getScreenCTM().inverse());

    var y = svgPoint.y - d_bat_r.h / 2;
    e_bat_r.setAttribute("y", y);
}

function startup(event)
{
    e_svg = document.documentElement;
    e_bat_l = document.getElementById("bat_l");
    e_bat_r = document.getElementById("bat_r");
    e_ball = document.getElementById("ball");
    e_pitch = document.getElementById("pitch");

    d_ball  = getBox(e_ball );
    d_pitch = getBox(e_pitch);
    d_bat_l = getBox(e_bat_l);
    d_bat_r = getBox(e_bat_r);

    e_score = [];
    e_score.push(document.getElementById("score_l"));
    e_score.push(document.getElementById("score_r"));

    e_digits = [[], []];
    for (var i = 0; i <= 10; i++) {
	e_digits[0].push(document.getElementById("digit_l_" + i));
	e_digits[1].push(document.getElementById("digit_r_" + i));
    }

    start();

    e_pitch.onmousemove = mousemove.bind(this);
    last = Date.now() / 1e3;
    setInterval(update.bind(this), 16.666);
}

