"use strict";

var xmlns="http://www.w3.org/2000/svg"

var SX = 100;
var SY = 100;

var blocks_init = {
    "large_0" : {"x": 1*SX, "y": 0*SY, "width": 2*SX, "height": 2*SY},
    "horz_0"  : {"x": 1*SX, "y": 2*SY, "width": 2*SX, "height": 1*SY},
    "vert_0"  : {"x": 0*SX, "y": 0*SY, "width": 1*SX, "height": 2*SY},
    "vert_1"  : {"x": 3*SX, "y": 0*SY, "width": 1*SX, "height": 2*SY},
    "vert_2"  : {"x": 0*SX, "y": 2*SY, "width": 1*SX, "height": 2*SY},
    "vert_3"  : {"x": 3*SX, "y": 2*SY, "width": 1*SX, "height": 2*SY},
    "small_0" : {"x": 1*SX, "y": 3*SY, "width": 1*SX, "height": 1*SY},
    "small_1" : {"x": 2*SX, "y": 3*SY, "width": 1*SX, "height": 1*SY},
    "small_2" : {"x": 0*SX, "y": 4*SY, "width": 1*SX, "height": 1*SY},
    "small_3" : {"x": 3*SX, "y": 4*SY, "width": 1*SX, "height": 1*SY}
};

var blocks;

var bound_x = 4*SX;
var bound_y = 5*SY;

var status_t;

var start_x, start_y;

var solver = null;
var solution_id = null;

function set_status(msg)
{
    var status = status_t;
    for (var i = 0; i < status.childNodes.length; i++)
	status.removeChild(status.childNodes[i]);
    status.appendChild(document.createTextNode(msg));
    document.rootElement.forceRedraw();
}

function moveto(elem, x, y)
{
    //elem.setAttribute("transform", "translate("+x+","+y+")");
    elem.setAttribute("x", x);
    elem.setAttribute("y", y);
}

function do_solution()
{
    if (solver == null || solver.solution == null || solver.solution.length == 0) {
        window.clearInterval(solution_id);
	solution_id = null;
	set_status("Done");
        solver = null;
	return;
    }

    var state = solver.solution.pop();

    var names = ["small","vert","horz","large"];
    for (var i = 0; i < names.length; i++) {
	var base = names[i];
	for (var j = 0; j < state[i].length; j++) {
	    var id = base + "_" + j;
	    var block = blocks[id];
	    var elem = document.getElementById(id);
	    var x = state[i][j][0];
	    var y = state[i][j][1];
	    elem.setAttribute('x', x*SX);
	    elem.setAttribute('y', y*SY);
	    block.x = SX * x;
	    block.y = SY * y;
	}
    }
}

function do_solve()
{
    if (solver.solve()) {
        set_status("Solved");
        solution_id = window.setInterval(do_solution, 200);
    }
    else
        window.requestAnimationFrame(do_solve);
}

function solve(evt)
{
    if (solver != null)
        return;

    set_status("Solving...");

    solver = new Solver();
    solver.begin();
    window.requestAnimationFrame(do_solve);
}

function collide_x(id, sx, sy, dx)
{
    var block = blocks[id];
    var x = sx + dx;
    var y = sy;
    var w = block.width;
    var h = block.height;

    if (x + w > bound_x)
	x = bound_x - w;
    if (x < 0)
	x = 0;

    for (var id2 in blocks) {
	if (id2 == id)
	    continue;

	var block2 = blocks[id2];
	var x2 = block2.x;
	var y2 = block2.y;
	var w2 = block2.width;
	var h2 = block2.height;

	if (y + h <= y2 || y >= y2 + h2)
	    continue;

	if (dx > 0) {
	    if (sx >= x2 + w2)
		continue;
	    if (x + w <= x2)
		continue;
	    x = x2 - w;
	}
	else {
	    if (sx + w <= x2)
		continue;
	    if (x >= x2 + w2)
		continue;
	    x = x2 + w2;
	}
    }

    return [x, sx + dx - x];
}

function collide_y(id, sx, sy, dy)
{
    var block = blocks[id];
    var x = sx;
    var y = sy + dy;
    var w = block.width;
    var h = block.height;

    if (y + h > bound_y)
	y = bound_y - h;
    if (y < 0)
	y = 0;

    for (var id2 in blocks) {
	if (id2 == id)
	    continue;

	var block2 = blocks[id2];
	var x2 = block2.x;
	var y2 = block2.y;
	var w2 = block2.width;
	var h2 = block2.height;

	if (x + w <= x2 || x >= x2 + w2)
	    continue;

	if (dy > 0) {
	    if (sy >= y2 + h2)
		continue;
	    if (y + h <= y2)
		continue;
	    y = y2 - h;
	}
	else {
	    if (sy + h <= y2)
		continue;
	    if (y >= y2 + h2)
		continue;
	    y = y2 + h2;
	}
    }

    return [y, sy + dy - y];
}

function collide(id, x, y, dx, dy)
{
    if (Math.abs(dx) > Math.abs(dy)) {
	[x, dx] = collide_x(id, x, y, dx);
	[y, dy] = collide_y(id, x, y, dy);
	[x, dx] = collide_x(id, x, y, dx);
    }
    else {
	[y, dy] = collide_y(id, x, y, dy);
	[x, dx] = collide_x(id, x, y, dx);
	[y, dy] = collide_y(id, x, y, dy);
    }

    return [x, y];
}

function event_pos(event)
{
    event.preventDefault();

    var elem = document.documentElement;
    var point = elem.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    point = point.matrixTransform(elem.getScreenCTM().inverse());
    return point;
}

function mousemove(id, event)
{
    event.preventDefault();

    var block = blocks[id];

    var pos = event_pos(event);
    var rel_x = pos.x - start_x;
    var rel_y = pos.y - start_y;
    var block_x, block_y;
    [block_x, block_y] = collide(id, block.x, block.y, rel_x, rel_y);

    var elem = document.getElementById(id);
    moveto(elem, block_x, block_y);
}

function check_done()
{
    var block = blocks.large_0;
    if (block.x == 1*SX && block.y == 3*SY)
	set_status("Done!");
}

function mouseup(id, event)
{
    if (event.button != 0)
	return;
    event.preventDefault();

    var block = blocks[id];

    var pos = event_pos(event);
    var rel_x = pos.x - start_x;
    var rel_y = pos.y - start_y;
    var block_x, block_y;
    [block_x, block_y] = collide(id, block.x, block.y, rel_x, rel_y);

    block.x = SX * Math.round(block_x / SX);
    block.y = SY * Math.round(block_y / SY);

    var elem = document.getElementById(id);
    moveto(elem, block.x, block.y);

    window.onmousemove = undefined;
    window.onmouseup   = undefined;

    set_status("");

    check_done();
}

function mousedown(id, event)
{
    if (solver != null)
	return;

    if (event.button != 0)
	return;
    event.preventDefault();

    var pos = event_pos(event);
    start_x = pos.x;
    start_y = pos.y;

    window.onmousemove = mousemove.bind(window, id);
    window.onmouseup   = mouseup.bind(window,   id);
}

function startup(evt)
{
    status_t = document.getElementById("status");

    set_status("Ready");

    if (solution_id != null) {
        window.clearInterval(solution_id);
	solution_id = null;
    }

    if (solver != null)
	solver = null;

    blocks = {};
    for (var id in blocks_init) {
	var block_init = blocks_init[id];
	var block = {};
	for (var k in block_init)
	    block[k] = block_init[k];
	blocks[id] = block;
    }

    for (var id in blocks) {
	var block = blocks[id];
	var elem = document.getElementById(id);
	moveto(elem, block.x, block.y);
	elem.onmousedown = mousedown.bind(window, id);
    }
}

