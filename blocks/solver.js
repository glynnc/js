function Solver()
{
    this.dirs = [[1,0], [0,1], [-1,0], [0,-1]];

    this.states = null;
    this.codes = null;
    this.solution = null;
    this.maxlen = null;
    this.maxdepth = null;
}

Solver.prototype = new Object();

Solver.prototype.encode = function(state)
{
    var code = 0;
    var mul = 1;
    for (var i = 0; i < state.length; i++) {
	for (var j = 0; j < state[i].length; j++) {
	    var x, y;
	    [x,y] = state[i][j];
	    var n = y*4+x;
	    code += n * mul;
	    mul *= 20;
	}
    }
    return code;
};

Solver.prototype.blocked = function(state, i0, j0, x0, y0, w0, h0)
{
    for (var i = 0; i < state.length; i++) {
	var w = (i >> 1) + 1;
	var h = (i & 1) + 1;
	for (var j = 0; j < state[i].length; j++) {
	    if (i == i0 && j == j0)
		continue;
	    var x = state[i][j][0];
	    var y = state[i][j][1];
	    if (x < x0 + w0 && x + w > x0 && y < y0 + h0 && y + h > y0)
		return true;
	}
    }
    return false;
};

Solver.prototype.solve1 = function(state)
{
    var code = this.encode(state);
    if (this.codes[code])
	return false;
    this.codes[code] = true;

    if (state[3][0][1] == 3 && state[3][0][0] == 1)
	return true;

    var result = [];
    for (var i = 0; i < state.length; i++) {
	var w = (i >> 1) + 1;
	var h = (i & 1) + 1;
	for (var j = 0; j < state[i].length; j++) {
	    var x = state[i][j][0];
	    var y = state[i][j][1];
	    for (var d = 0; d < 4; d++) {
		var dir = this.dirs[d];
		var nx = x + dir[0];
		var ny = y + dir[1];
		if (nx < 0 || ny < 0 || nx + w > 4 || ny + h > 5)
		    continue;
		if (this.blocked(state, i, j, nx, ny, w, h))
		    continue;

		var nstate = [[],[],[],[]];
		for (var i2 = 0; i2 < state.length; i2++)
		    for (var j2 = 0; j2 < state[i2].length; j2++)
			nstate[i2].push((i2 == i && j2 == j) ? [nx,ny] : state[i2][j2]);
		nstate[0].sort();
		nstate[1].sort();
		result.push(nstate);
	    }
	}
    }

    return result;
};

Solver.prototype.solve = function()
{
    this.maxdepth++;

    var nstates = [];

    for (var i = 0; i < this.states.length; i++) {
	var state_data = this.states[i];
	var state = state_data.state;
	var parent = state_data.parent;
	var result = this.solve1(state);
	if (result == false)
	    continue;
	if (result == true) {
	    this.found(state_data);
	    return true;
	}
	for (var j = 0; j < result.length; j++)
	    nstates.push({'state':result[j], 'parent':state_data});
    }

    if (this.maxlen < nstates.length)
	this.maxlen = nstates.length;

    this.states = nstates;

    return false;
};

Solver.prototype.found = function(state)
{
    this.solution = [];
    while (state != null) {
	this.solution.push(state.state);
	state = state.parent;
    }
};

Solver.prototype.begin = function()
{
    var state = [[],[],[],[]];
    for (var id in blocks) {
	var block = blocks[id];
	var x = block.x / SX;
	var y = block.y / SX;
	var w = block.width / SX;
	var h = block.height / SY;
	var n = (w-1)*2+(h-1);
	state[n].push([x,y]);
    }
    state[0].sort();
    state[1].sort();

    this.states = [{'state':state, 'parent':null}];
    this.solution = null;
    this.codes = {};
    this.maxlen = 0;
    this.maxdepth = 0;
};

