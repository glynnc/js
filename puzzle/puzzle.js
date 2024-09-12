"use strict";

function Puzzle(canvas, image, nx, ny)
{
    this.dirs = [[1,0], [0,1], [-1,0], [0,-1]];

    this.canvas = canvas;
    this.image = image;
    this.nx = nx;
    this.ny = ny;

    this.canvas.setAttribute("tabIndex", 1);
    this.canvas.focus();
    this.ctx = canvas.getContext("2d");

    this.canvas.onkeypress  = this.key_press.bind(this);
    this.canvas.onmousedown = this.mouse_down.bind(this);
    this.image.onload = this.refresh.bind(this);

    this.grid = this.new_grid(nx, ny);
    this.hole = [nx-1,ny-1];
    this.complete = true;

    this.solver = null;
    this.solution_id = null;
}

Puzzle.prototype = new Object;

Puzzle.prototype.new_grid = function(nx, ny)
{
    var grid = [];
    for (var y = 0; y < ny; y++) {
	var row = [];
	for (var x = 0; x < nx; x++)
	    row.push([x,y]);
	grid.push(row);
    }
    return grid;
};

Puzzle.prototype.check = function()
{
    for (var y = 0; y < this.ny; y++) {
	for (var x = 0; x < this.nx; x++) {
	    var id = this.grid[y][x];
	    if (id[0] != x || id[1] != y) {
		this.complete = false;
		return;
	    }
	}
    }

    this.complete = true;
};

Puzzle.prototype.set_status = function(msg)
{
    var status = document.getElementById("status");
    status.textContent = msg;
};

Puzzle.prototype.draw = function()
{
    var dst_w = this.canvas.width;
    var dst_h = this.canvas.height;
    var src_w = this.image.width;
    var src_h = this.image.height;

    for (var dv = 0; dv < this.ny; dv++) {
	var dy0 = Math.floor(dst_h * (dv + 0) / this.ny);
	var dy1 = Math.floor(dst_h * (dv + 1) / this.ny);
	for (var du = 0; du < this.nx; du++) {
	    var dx0 = Math.floor(dst_w * (du + 0) / this.nx);
	    var dx1 = Math.floor(dst_w * (du + 1) / this.nx);

            var id = this.grid[dv][du];
	    var su = id[0];
	    var sv = id[1];
	    if (!this.complete && su == this.nx-1 && sv == this.ny-1) {
		this.ctx.fillRect(dx0, dy0, dx1 - dx0, dy1 - dy0);
	    }
	    else {
		var sx0 = Math.floor(src_w * (su + 0) / this.nx);
		var sx1 = Math.floor(src_w * (su + 1) / this.nx);
		var sy0 = Math.floor(src_h * (sv + 0) / this.ny);
		var sy1 = Math.floor(src_h * (sv + 1) / this.ny);

		this.ctx.drawImage(
		    this.image,
		    sx0, sy0, sx1 - sx0, sy1 - sy0,
		    dx0, dy0, dx1 - dx0, dy1 - dy0);
	    }
        }
    }
};

Puzzle.prototype.refresh = function()
{
    this.check();
    window.requestAnimationFrame(this.draw.bind(this));
};

Puzzle.prototype.move_by = function(dx, dy)
{
    var x0 = this.hole[0];
    var y0 = this.hole[1];
    var x1 = x0 + dx;
    var y1 = y0 + dy;

    if (x1 < 0 || x1 >= this.nx || y1 < 0 || y1 >= this.ny)
	return;

    var tmp = this.grid[y0][x0];
    this.grid[y0][x0] = this.grid[y1][x1];
    this.grid[y1][x1] = tmp;
    this.hole = [x1, y1];
};

Puzzle.prototype.shuffle = function(count)
{
    for (var i = 0; i < count; i++) {
	var d = Math.floor(Math.random() * 4);
	var dir = this.dirs[d];
	this.move_by(dir[0], dir[1]);
    }
};

Puzzle.prototype.do_solution = function()
{
    if (this.solver == null || this.solver.solution == null || this.solver.solution.length == 0) {
	this.set_status("...");
        window.clearInterval(this.solution_id);
	this.solution_id = null;
        this.solver = null;
	return;
    }

    var state = this.solver.solution.pop();

    this.grid = state.grid;
    this.hole = state.hole;
    this.check();
    this.draw();
};

Puzzle.prototype.do_solve = function()
{
    if (this.solver.solve()) {
	this.set_status("Solved");
        this.solution_id = window.setInterval(this.do_solution.bind(this), 200);
    }
    else {
	this.set_status("Solving: " + this.solver.stage + "(" + this.solver.maxdepth + ")");
        window.requestAnimationFrame(this.do_solve.bind(this));
    }
}

Puzzle.prototype.solve = function()
{
    if (this.solver != null)
	return;
    this.set_status("Solving");
    this.solver = new Solver(this.nx, this.ny);
    this.solver.begin(this.grid, this.hole);
    window.requestAnimationFrame(this.do_solve.bind(this));
};

Puzzle.prototype.key_press = function(event)
{
    var key = event.key;
    if (key.startsWith("Arrow"))
	key = key.substr(5);

    if (key == "Left")	this.move_by(-1, 0);
    if (key == "Right") this.move_by( 1, 0);
    if (key == "Down")	this.move_by( 0, 1);
    if (key == "Up")	this.move_by( 0,-1);

    if (key == "r")	this.shuffle(1000);
    if (key == "s")	this.solve();

    this.refresh();
};

Puzzle.prototype.mouse_down = function(event)
{
    if (event.button != 0)
	return;

    var dst_w = this.canvas.width;
    var dst_h = this.canvas.height;

    var rect = this.canvas.getBoundingClientRect();
    var x = event.clientX - rect.left;
    var y = event.clientY - rect.top;
    var u = Math.floor(x * this.nx / dst_w);
    var v = Math.floor(y * this.ny / dst_h);

    if ((u == this.hole[0]) == (v == this.hole[1]))
	return;

    while (u > this.hole[0])
	this.move_by( 1, 0);
    while (u < this.hole[0])
	this.move_by(-1, 0);
    while (v > this.hole[1])
	this.move_by( 0, 1);
    while (v < this.hole[1])
	this.move_by( 0,-1);

    this.refresh();
};

Puzzle.prototype.load_image = function(urltext, event)
{
    if (event.type == "keypress" && event.key == "Enter")
	event.preventDefault();
    this.image.src = urltext.value;
};

// ************************************************************

var app = null;

function init() {
    var canvas = document.getElementById("canvas");
    var image = document.getElementById("picture");
    var urltext = document.getElementById("url");
    var urlbutton = document.getElementById("go");
    var nx = puzzle_size.x;
    var ny = puzzle_size.y;
    app = new Puzzle(canvas, image, nx, ny);
    urltext.onkeypress = app.load_image.bind(app, urltext);
    urlbutton.onclick = app.load_image.bind(app, urltext);
    app.shuffle(1000);
    app.refresh();
};
