"use strict";

var svg_ns = "http://www.w3.org/2000/svg";
var xlink_ns = "http://www.w3.org/1999/xlink";

var run = false;
var start = null;
var start_angle = 0.0;
var omega = 1e-3;
var side = false;

var toplevel = null;
var cranks = [];

var drag_crank = null;
var drag_id = null;
var drag_x = null;
var drag_y = null;

function Crank(angle)
{
    this.PIVOT_CENTER      = null;
    this.PIVOT_BIG_END     = null;
    this.PIVOT_LITTLE_END  = null;
    this.PIVOT_RAIL_START  = null;
    this.PIVOT_RAIL_END    = null;

    this.pivots = [];

    this.BAR_CRANK = null;
    this.BAR_CONN  = null;
    this.BAR_RAIL  = null;

    this.bars = [];

    this.angle = angle;
}

Crank.prototype = new Object;

Crank.prototype.create = function(cx, cy, r, l, rx)
{
    var bx = cx + r * Math.cos(this.angle);
    var by = cy + r * Math.sin(this.angle);
    var dx = rx - bx;
    var dy = Math.sqrt(l*l - dx*dx);
    var ly = by + dy;

    this.PIVOT_CENTER      = this.make_pivot("center",  cx,  cy);
    this.PIVOT_BIG_END     = this.make_pivot("big_end", bx,  by);
    this.PIVOT_LITTLE_END  = this.make_pivot("lit_end", rx,  ly);
    this.PIVOT_RAIL_START  = this.make_pivot("rail_0",  rx, -275);
    this.PIVOT_RAIL_END    = this.make_pivot("rail_1",  rx,  275);

    this.BAR_CRANK = this.make_bar("crank", this.PIVOT_CENTER, this.PIVOT_BIG_END);
    this.BAR_CONN  = this.make_bar("conn" , this.PIVOT_BIG_END, this.PIVOT_LITTLE_END);
    this.BAR_RAIL  = this.make_bar("rail" , this.PIVOT_RAIL_START, this.PIVOT_RAIL_END);
};

Crank.prototype.make_pivot = function(name, x, y)
{
    var id = this.pivots.length;

    var e = document.createElementNS(svg_ns, "use");
    e.setAttribute("id", name);
    e.setAttributeNS(xlink_ns, "href", "#pivot");
    e.setAttribute("transform", "translate(" + x + "," + y + ")");

    e.onmousedown = this.mouse_down.bind(this, id);

    var d = {
        elem: e,
        x: x,
        y: y
    };
    this.pivots.push(d);

    this.update_pivot(id);
    toplevel.appendChild(e);

    return id;
};

Crank.prototype.update_pivot = function(id)
{
    var pivot = this.pivots[id];

    var xforms = pivot.elem.transform.baseVal;
    xforms.clear();

    var move = document.documentElement.createSVGTransform();
    move.setTranslate(pivot.x, pivot.y);
    xforms.appendItem(move);
};

Crank.prototype.make_bar = function(name, start, end)
{
    var id = this.bars.length;

    var e = document.getElementById("bar").cloneNode();
    e.setAttribute("id", name);
    e.setAttributeNS(xlink_ns, "href", "#bar");
    e.setAttribute("transform", "translate(0,0)");

    var d = {
        elem: e,
        pivots: [start, end],
        length: null
    };
    this.bars.push(d);

    this.update_bar(id);
    toplevel.appendChild(e);

    return id;
};

Crank.prototype.update_bar = function(id)
{
    var bar = this.bars[id];
    var element = bar.elem;
    var p0 = this.pivots[bar.pivots[0]];
    var p1 = this.pivots[bar.pivots[1]];

    var xforms = element.transform.baseVal;
    xforms.clear();

    var move = document.documentElement.createSVGTransform();
    move.setTranslate(p0.x, p0.y);
    xforms.appendItem(move);

    var dx = p1.x - p0.x;
    var dy = p1.y - p0.y;
    var angle = Math.atan2(dx, dy);
    var length = Math.hypot(dx, dy);

    var rotate = document.documentElement.createSVGTransform();
    rotate.setRotate(-angle * 180 / Math.PI, 0, 0);
    xforms.appendItem(rotate);

    bar.length = length;
    bar.elem.height.baseVal.value = length+20;
};

Crank.prototype.update_bars = function()
{
    for (var i = 0; i < this.bars.length; i++)
        this.update_bar(i);
};

Crank.prototype.intersect = function(flip)
{
    var cx = this.pivots[this.PIVOT_BIG_END].x;
    var cy = this.pivots[this.PIVOT_BIG_END].y;
    var r = this.bars[this.BAR_CONN].length;
    var x0 = this.pivots[this.PIVOT_RAIL_START].x;
    var y0 = this.pivots[this.PIVOT_RAIL_START].y;
    var x1 = this.pivots[this.PIVOT_RAIL_END].x;
    var y1 = this.pivots[this.PIVOT_RAIL_END].y;
    var tx = x1-x0;
    var ty = y1-y0;
    var l = Math.hypot(tx, ty);
    tx /= l;
    ty /= l;
    var nx =  ty;
    var ny = -tx;
    var dx = cx-x0;
    var dy = cy-y0;
    var u = tx*dx + ty*dy;
    var v = nx*dx + ny*dy;
    var du2 = r*r - v*v;
    if (du2 < 0)
        return;
    var du = Math.sqrt(du2);
    if (flip)
        du = -du;
    var uu = u+du;
    var x = x0 + tx*uu;
    var y = y0 + ty*uu;
    this.pivots[this.PIVOT_LITTLE_END].x = x;
    this.pivots[this.PIVOT_LITTLE_END].y = y;
};

Crank.prototype.rotate = function(angle)
{
    var a = this.angle + angle;
    var l = this.bars[this.BAR_CRANK].length;
    this.pivots[this.PIVOT_BIG_END].x = this.pivots[this.PIVOT_CENTER].x + l * Math.cos(a);
    this.pivots[this.PIVOT_BIG_END].y = this.pivots[this.PIVOT_CENTER].y + l * Math.sin(a);
};

Crank.prototype.update = function(angle)
{
    this.rotate(angle);
    this.intersect(side);
    this.update_pivot(this.PIVOT_BIG_END);
    this.update_pivot(this.PIVOT_LITTLE_END);
    this.update_bars();
};

Crank.prototype.mouse_move = function(evt)
{
    var p = event_pos(evt);
    var id = drag_id;

    var old_x = this.pivots[id].x;
    var old_y = this.pivots[id].y;
    this.pivots[id].x = drag_x + p.x;
    this.pivots[id].y = drag_y + p.y;

    this.update_pivot(id);
    this.update_bars();
};

Crank.prototype.mouse_down = function(id, evt)
{
    var p = event_pos(evt);
    drag_crank = this;
    drag_id = id;
    drag_x = this.pivots[id].x - p.x;
    drag_y = this.pivots[id].y - p.y;
    evt.stopPropagation();
};

function draw(timestamp)
{
    if (start === null)
        start = timestamp;

    var delta = timestamp - start;
    var angle = start_angle + delta * omega;
    for (var i = 0; i < cranks.length; i++)
        cranks[i].update(angle);

    if (run)
        window.requestAnimationFrame(draw);
    else {
        start = null;
        start_angle = angle;
    }
}

function toggle_run(evt)
{
    run = !run;
    if (run)
        window.requestAnimationFrame(draw);
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

function mouse_up(evt)
{
    drag_crank = null;
    drag_id = null;
    drag_x = null;
    drag_y = null;
}

function mouse_move(evt)
{
    if (drag_crank != null)
        drag_crank.mouse_move(evt);
}

function key_press(evt)
{
    if (evt.key.toLowerCase() == "s")
	side = !side;
}

function startup(evt)
{
    toplevel = document.getElementById("toplevel");

    var crank1 = new Crank(0.0);
    crank1.create(0, -150, 110, 315, 200);
    cranks.push(crank1);

    var crank2 = new Crank(Math.PI/2);
    crank2.create(0, -150, 110, 315, -200);
    cranks.push(crank2);

    document.documentElement.onmousedown = function () { toggle_run() };

    window.onmousemove = function (evt) { mouse_move(evt); }
    window.onmouseup   = function (evt) { mouse_up(evt); }
    window.onkeypress  = function (evt) { key_press(evt); }

    toggle_run(null);
}
