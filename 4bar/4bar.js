"use strict";

var svg_ns = "http://www.w3.org/2000/svg";
var xlink_ns = "http://www.w3.org/1999/xlink";

var run = false;
var start = null;
var start_angle = null;
var angle = 0.0;
var omega = 1e-3;
var side = false;
var path_steps = 360;
var path_spacing = 10;

var PIVOT_A = 0;
var PIVOT_B = 1;
var PIVOT_C = 2;
var PIVOT_D = 3;

var pivot_names = ["pivot_A", "pivot_B", "pivot_C", "pivot_D"];
var pivot = [null,null,null,null];
var px = [null,null,null,null];
var py = [null,null,null,null];

var BAR_AB = 0;
var BAR_BC = 1;
var BAR_CD = 2;
var BAR_DA = 3;

var bar_names = ["AB", "BC", "CD", "DA"];
var bar = [null,null,null,null];
var rect = [null,null,null,null];
var length = [null,null,null,null];
var angles = [null,null,null,null];
var limits = null;

var anchor = null;
var ax = null;
var ay = null;

var trace = null;
var markers = null;

var status_t = null;

var drag = null;
var drag_x = null;
var drag_y = null;

function matrix(element)
{
    return element.transform.baseVal.consolidate().matrix;
}

function circle_intersection(r1, r2, d)
{
    var d2 = d * d;
    var a = (d2 - (r2-r1)*(r2+r1))/(2*d);
    var b = (d2 + (r2-r1)*(r2+r1))/(2*d);
    var n2 = -(r2-r1-d)*(r2-r1+d)*(r2+r1-d)*(r2+r1+d);
    if (n2 < 0)
        return null;
    var h = Math.sqrt(n2)/(2*d);
    var t1 = Math.atan2(h, a);
    var t2 = Math.atan2(h, b);
    return {a: a, b: b, h: h, t1: t1, t2: t2};
}

function calc_limits()
{
    var ab = length[BAR_AB];
    var bc = length[BAR_BC];
    var cd = length[BAR_CD];
    var ad = length[BAR_DA];
    var diff = Math.abs(bc - ad);
    if (ab <= cd - diff)
        return null;

    var r1 = ab;
    var r2a = bc - cd;
    var r2b = bc + cd;
    var i1 = circle_intersection(r1, r2a, ad);
    var i2 = circle_intersection(r1, r2b, ad);

    return (
        (i1 === null && i2 === null) ? null :
        (i1 === null) ? [-i2.t1, i2.t1] :
        (i2 === null) ? [i1.t1, 2*Math.PI - i1.t1] :
        [i1.t1, i2.t1]);
}

function get_limits()
{
    limits = calc_limits();
}

function feasible()
{
    var ab = length[BAR_AB];
    var bc = length[BAR_BC];
    var cd = length[BAR_CD];
    var ad = length[BAR_DA];

    return Math.abs(ad - bc) <= ab + cd;
}

function intersect(px, py)
{
    var r0 = length[BAR_BC];
    var r1 = length[BAR_CD];

    var dx = px[PIVOT_D] - px[PIVOT_B];
    var dy = py[PIVOT_D] - py[PIVOT_B];

    var d = Math.hypot(dx, dy);
    var a = (r0*r0 - r1*r1 + d*d) / (2.0 * d);

    var x2 = px[PIVOT_B] + (dx * a/d);
    var y2 = py[PIVOT_B] + (dy * a/d);

    var h2 = r0*r0 - a*a;
    if (h2 < 0)
        return;
    var h = Math.sqrt(h2);

    var rx = -dy * (h/d);
    var ry =  dx * (h/d);

    var cx1 = x2 + rx;
    var cy1 = y2 + ry;

    var cx2 = x2 - rx;
    var cy2 = y2 - ry;

    if (side) {
        px[PIVOT_C] = cx1;
        py[PIVOT_C] = cy1;
    }
    else {
        px[PIVOT_C] = cx2;
        py[PIVOT_C] = cy2;
    }
}

function get_bars()
{
    for (var i = 0; i < 4; i++) {
        var j = (i + 1) % 4;
        var dx = px[j] - px[i];
        var dy = py[j] - py[i];
        length[i] = Math.hypot(dx, dy);
        angles[i] = Math.atan2(dy, dx);
    }
}

function update_bar(i)
{
    var j = (i + 1) % 4;
    var element = bar[i];
    var x0 = px[i];
    var y0 = py[i];
    var x1 = px[j];
    var y1 = py[j];

    var xforms = element.transform.baseVal;
    xforms.clear();

    var move = document.documentElement.createSVGTransform();
    move.setTranslate(x0, y0);
    xforms.appendItem(move);

    var angle = Math.atan2(x1 - x0, y1 - y0);

    var rotate = document.documentElement.createSVGTransform();
    var a = angle;
    rotate.setRotate(-a * 180 / Math.PI, 0, 0);
    xforms.appendItem(rotate);

    rect[i].y.baseVal.value = -10;
    rect[i].height.baseVal.value = length[i]+20;
}

function update_bars()
{
    for (var i = 0; i < 4; i++)
        update_bar(i);
}

function update_anchor()
{
    var xforms = anchor.transform.baseVal;
    xforms.clear();

    var move = document.documentElement.createSVGTransform();
    move.setTranslate(ax, ay);
    xforms.appendItem(move);
}

function rotate(px, py, angle)
{
    px[PIVOT_B] = px[PIVOT_A] + length[BAR_AB] * Math.cos(angle);
    py[PIVOT_B] = py[PIVOT_A] + length[BAR_AB] * Math.sin(angle);
}

function update()
{
    rotate(px, py, angle);
    intersect(px, py);
    update_bars();
}

function trace_path()
{
    var qx = px.slice();
    var qy = py.slice();

    trace.pathSegList.clear();
    while (markers.childElementCount > 0)
        markers.removeChild(markers.firstChild);
    
    for (var i = 0; i < path_steps; i++) {
        var angle = 2 * Math.PI * i / path_steps;
        rotate(qx, qy, angle);
        intersect(qx, qy);
        var x0 = qx[PIVOT_B];
        var y0 = qy[PIVOT_B];
        var x1 = qx[PIVOT_C];
        var y1 = qy[PIVOT_C];
        var dx = x1 - x0;
        var dy = y1 - y0;
        var l = Math.hypot(dx, dy);
        var yx = dx / l;
        var yy = dy / l;
        var xx = yy;
        var xy = -yx;
        var x = x0 + xx * ax + yx * ay;
        var y = y0 + xy * ax + yy * ay;
        var item = (
            (i == 0)
            ? trace.createSVGPathSegMovetoAbs(x, y)
            : trace.createSVGPathSegLinetoAbs(x, y));
        if (i % path_spacing == 0) {
            var elem = document.createElementNS(svg_ns, "use");
            elem.setAttributeNS(xlink_ns, "href", "#marker");
            elem.setAttribute("transform", "matrix(" + xx + "," + xy + "," + yx + "," + yy + "," + x + "," + y + ")");
            markers.appendChild(elem);
        }
        trace.pathSegList.appendItem(item);
    }
    trace.pathSegList.appendItem(trace.createSVGPathSegClosePath());
}

function draw(timestamp)
{
    // set_status("" + Math.round(start) + "," + Math.round(timestamp) + "," + Math.round(start_angle) + "," + Math.round(angle));
    if (start === null) {
        start = timestamp;
        start_angle = angle;
    }

    var delta = (timestamp - start) * omega;
    if (limits === null)
        angle = start_angle + delta;
    else {
        var range = limits[1] - limits[0];
        delta %= 2 * range;
        angle = (delta < range)
            ? limits[0] + delta
            : limits[1] - (delta - range);
        angle += angles[BAR_DA] + Math.PI;
    }
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
    status.appendChild(document.createTextNode(msg));
}

function event_pos(event)
{
    event.preventDefault();

    var elem = document.documentElement;
    var point = elem.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    //point = point.matrixTransform(elem.getScreenCTM().inverse());
    return point;
}

function anchor_down(evt)
{
    var p = event_pos(evt);
    p = p.matrixTransform(bar[BAR_BC].getScreenCTM().inverse());

    drag = -1;
    drag_x = ax - p.x;
    drag_y = ay - p.y;
    set_status("click: " + "anchor");
    evt.stopPropagation();
}

function anchor_move(evt)
{
    var p = event_pos(evt);
    p = p.matrixTransform(bar[BAR_BC].getScreenCTM().inverse());

    ax = drag_x + p.x;
    ay = drag_y + p.y;

    update_anchor();
}

function mouse_down(evt, id)
{
    var p = event_pos(evt);
    drag = id;
    drag_x = px[id] - p.x;
    drag_y = py[id] - p.y;
    set_status("click: " + id);
    evt.stopPropagation();
}

function mouse_up(evt)
{
    drag = null;
    drag_x = null;
    drag_y = null;
    get_limits();
    trace_path();
}

function mouse_move(evt)
{
    if (drag == null)
	return;

    if (drag == -1)
        return anchor_move(evt);

    var p = event_pos(evt);
    var id = drag;

    var old_x = px[id];
    var old_y = py[id];
    px[id] = drag_x + p.x;
    py[id] = drag_y + p.y;

    get_bars();

    if (feasible()) {
        start_angle = null;
    }
    else {
	px[id] = old_x;
	py[id] = old_y;
    }

    update_bars();
}

function key_press(evt)
{
    if (evt.key.toLowerCase() == "s")
	side = !side;
}

function startup(evt)
{
    for (var i = 0; i < 4; i++) {
        pivot[i] = document.getElementById(pivot_names[i]);
        bar[i] = document.getElementById("bar_" + bar_names[i]);
        rect[i] = document.getElementById("rect_" + bar_names[i]);
        var m = bar[i].transform.baseVal.consolidate().matrix;
        px[i] = m.e;
        py[i] = m.f;
    }

    anchor = document.getElementById("anchor");
    var m = anchor.transform.baseVal.consolidate().matrix;
    ax = m.e;
    ay = m.f;

    trace = document.getElementById("trace");
    markers = document.getElementById("markers");

    get_bars();

    get_limits();
    trace_path();

    document.documentElement.onmousedown = function () { toggle_run() };

    status_t = document.getElementById("status");

    for (var i = 0; i < 4; i++)
        pivot[i].onmousedown = (function(i) { return function(evt) { mouse_down(evt, i); } })(i);

    anchor.onmousedown = function(evt) { anchor_down(evt); }
    
    window.onmousemove = function (evt) { mouse_move(evt); }
    window.onmouseup   = function (evt) { mouse_up(evt); }
    window.onkeypress  = function (evt) { key_press(evt); }

    toggle_run(null);
}

// feasible:
// bc - (ab + cd) <= ad <= bc + (ab + cd)
// -> |ad - bc| <= ab + cd

// full rotation (A):
// bc - ab >= ad - cd
// bc + ab <= ad + cd
// ab <= cd - |bc - ad|

// full rotation (C)
// ad - cd - bc >= -ab
// ad + cd - bc <= ab
// cd <= ab - |bc - ad|

// ab + bc + cd >= ad
// bc + cd + ad >= ab
// cd + ad + ab >= bc
// ad + ab + bc >= cd

// ab <= dc for a to rotate fully
