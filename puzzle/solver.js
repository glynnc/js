"use strict";

function Solver(nx, ny)
{
    this.nx = nx;
    this.ny = ny;

    this.states = null;
    this.codes = null;
    this.solution = null;
    this.maxlen = null;
    this.maxdepth = null;
    this.minrows = null;
}

Solver.prototype = new Object();

Solver.prototype.dirs = [[1,0], [0,1], [-1,0], [0,-1]];

Solver.prototype.encode = function(hole, grid, stage)
{
    var code = "" + hole[0] + "," + hole[1];
    var miny = Math.floor(stage / this.nx);
    var next = (miny >= this.ny - 2 ? this.ny * this.nx : 
                stage % this.nx >= this.nx - 2 ? (miny + 1) * this.nx :
                stage + 1);

    for (var y = miny; y < this.ny; y++) {
	for (var x = 0; x < this.nx; x++) {
	    var xy = grid[y][x];
            var i = xy[1] * this.nx + xy[0];
	    code += ";" + (i < next ? i : "?");
	}
    }

    return code;
};

Solver.prototype.solved = function(grid)
{
    for (var y = 0; y < this.ny; y++) {
        for (var x = 0; x < this.nx; x++) {
            var xy = grid[y][x];
            if (xy[0] != x || xy[1] != y)
                return ((y >= this.ny-2)
                        ? (this.ny-2) * this.nx
                        : y * this.nx + Math.min(this.nx-2, x));
        }
    }

    return this.ny * this.nx;
};

Solver.prototype.solve1 = function(state)
{
    var grid = state.grid;
    var hole = state.hole;
    var miny = Math.floor(state.stage / this.nx);

    var code = this.encode(hole, grid, state.stage);
    if (this.codes[code])
	return [];
    this.codes[code] = true;

    var result = [];
    var x0 = hole[0];
    var y0 = hole[1];
    for (var d = 0; d < 4; d++) {
	var dir = this.dirs[d];
	var x1 = x0 + dir[0];
	var y1 = y0 + dir[1];
	if (x1 < 0 || x1 >= this.nx || y1 < miny || y1 >= this.ny)
	    continue;
	
	var ngrid = [];
	for (var y = 0; y < this.ny; y++) {
	    if (y == y0 || y == y1) {
		var nrow = [];
		for (var x = 0; x < this.nx; x++)
		    nrow.push(grid[y][x]);
		ngrid.push(nrow);
	    }
	    else
		ngrid.push(grid[y]);
	}

	ngrid[y0][x0] = grid[y1][x1];
	ngrid[y1][x1] = grid[y0][x0];
	var nhole = [x1, y1];
	var nstage = this.solved(ngrid);
	var nstate = {grid: ngrid, hole: nhole, stage: nstage, parent: state};
        if (nstage >= state.stage)
            result.push(nstate);
    }

    return result;
};

Solver.prototype.solve = function()
{
    if (this.stage >= this.nx * this.ny) {
	this.found(this.states[0]);
	return true;
    }

    this.maxdepth++;
    var nstates = [];
    for (var i = 0; i < this.states.length; i++) {
        var state = this.states[i];
        if (state.stage < this.stage)
            continue;
        var result = this.solve1(state);
        for (var j = 0; j < result.length; j++) {
            var nstate = result[j];
            if (nstate.stage < this.stage)
                continue;
            if (nstate.stage > this.stage) {
                nstates = [];
                this.stage = nstate.stage;
            }
            nstates.push(nstate);
        }
    }

    if (nstates.length == 0)
        throw "fail";

    this.maxlen = Math.max(this.maxlen, nstates.length);
    this.states = nstates;

    return false;
};

Solver.prototype.found = function(state)
{
    this.codes = null;
    this.states = null;

    this.solution = [];
    while (state != null) {
	this.solution.push(state);
	state = state.parent;
    }
};

Solver.prototype.begin = function(grid, hole)
{
    var state = {grid: grid, hole: hole, stage: 0, parent: null};

    this.states = [state];
    this.stage = 0;
    this.solution = null;
    this.codes = {};
    this.maxlen = 0;
    this.maxdepth = 0;

    state.stage = this.solved(grid);
    this.stage = state.stage;
};

