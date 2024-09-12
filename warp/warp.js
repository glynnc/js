"use strict";

// ************************************************************

var MAX_POINTS = 16;
var image;
var warps;
var src_c, dst_c;

// ************************************************************

function load_resource(url)
{
    var req = new XMLHttpRequest();
    req.open('GET', url, false);
    req.overrideMimeType('text/plain; charset=x-user-defined');
    req.send(null);
    if (req.status != 200 && req.status != 0) return null;
    return req.responseText;
}

function load_source(element_id)
{
    var element = document.getElementById(element_id);
    if (!element)
        throw Error("element '" + element_id + "' not found");

    if (element.hasAttribute("src"))
        return load_resource(element.src);
    else
        return element.text;
}

// ************************************************************

function Warp(parent, which, src, dst)
{
    this.parent = parent;
    this.which = which;
    this.src = src;
    this.dst = dst;
    this.s2 = [];
    this.w = [];
    for (var i = 0; i < MAX_POINTS; i++) {
	this.s2.push(0);
	this.w.push([0,0]);
    }
}

Warp.prototype = new Object;

Warp.prototype.npoints = function()
{
    return this.parent.npoints
};

Warp.prototype.get_src = function()
{
    var src = this.src.slice(0, this.npoints());
    for (var i = 0; i < src.length; i++)
	src[i] = src[i].slice();
    return src;
};

Warp.prototype.get_dst = function()
{
    var dst = this.dst.slice(0, this.npoints());
    for (var i = 0; i < dst.length; i++)
	dst[i] = dst[i].slice();
    return dst;
};

Warp.prototype.distance_squared = function(x, y, y_is_x)
{
    if (y_is_x) {
	var gram = [];
	for (var r = 0; r < x.length; r++) {
	    var row = [];
	    for (var c = 0; c < x.length; c++)
		row.push(x[r][0] * x[c][0] + x[r][1] * x[c][1]);
	    gram.push(row);
	}

	var result = []
	for (var r = 0; r < x.length; r++) {
	    var row = [];
	    for (var c = 0; c < x.length; c++)
		row.push(gram[r][r] + gram[c][c] - 2 * gram[r][c]);
	    result.push(row);
	}
	return result;
    }
    else {
	var gram = [];
	for (var r = 0; r < x.length; r++) {
	    var row = [];
	    for (var c = 0; c < y.length; c++)
		row.push(x[r][0] * y[c][0] + x[r][1] * y[c][1]);
	    gram.push(row);
	}

	var diagx = [];
	for (var i = 0; i < x.length; i++)
	    diagx.push(x[i][0] * x[i][0] + x[i][1] * x[i][1]);

	var diagy = [];
	for (var i = 0; i < y.length; i++)
	    diagy.push(y[i][0] * y[i][0] + y[i][1] * y[i][1]);

	var result = []
	for (var r = 0; r < x.length; r++) {
	    row = [];
	    for (var c = 0; c < y.length; c++)
		row.push(diagx[r] + diagy[c] - 2 * gram[r][c]);
	    result.push(row);
	}
	return result;
    }
};

Warp.prototype.rbf = function(x, y, y_is_x)
{
    var dists2 = this.distance_squared(x, y, y_is_x)

    if (y_is_x) {
	var d2max = dists2[0][0];
	for (var r = 0; r < dists2.length; r++)
	    for (var c = 0; c < dists2[r].length; c++)
		if (d2max < dists2[r][c])
		    d2max = dists2[r][c];

	var dtmp = [];
	for (var r = 0; r < dists2.length; r++) {
	    var row = [];
	    for (var c = 0; c < dists2[r].length; c++)
		row.push((r == c) ? d2max : dists2[r][c]);
	    dtmp.push(row);
	}

	for (var c = 0; c < dtmp[0].length; c++) {
	    var min = dtmp[0][c];
	    for (var r = 1; r < dtmp.length; r++)
		if (min > dtmp[r][c])
		    min = dtmp[r][c];
	    this.s2[c] = min;
	}
    }

    var result = [];
    for (var r = 0; r < dists2.length; r++) {
	var row = [];
	for (var c = 0; c < dists2[r].length; c++)
	    row.push(Math.sqrt(dists2[r][c] + this.s2[c]));
	result.push(row);
    }

    return result;
};

// solve A.x = b
function linsolve(A, b)
{
    var rows = A.length;
    var cols = A[0].length;
    var bcols = b[0].length;

    for (var c = 0; c < cols - 1; c++) {
	// make column c of all rows > c equal to zero
	//  by subtracting the appropriate multiple of row c
	var r0 = c;
	var r1 = r0+1;

	// find row with largest value in column c (pivot row)
	var max = Math.abs(A[r0][c]);
	var max_r = r0;
	for (var r = r0+1; r < rows; r++) {
	    var x = Math.abs(A[r][c]);
	    if (max < x) {
		max = x;
		max_r = r;
	    }
	}

	// move pivot row to top
	if (max_r != r0) {
	    var tA = A[r0];
	    A[r0] = A[max_r];
	    A[max_r] = tA;
	    var tb = b[r0];
	    b[r0] = b[max_r];
	    b[max_r] = tb;
	}

	for (var r = r1; r < rows; r++) {
	    var k0 = A[r0][c];
	    var k1 = A[r][c];
	    for (var i = c; i < cols; i++)
		A[r][i] = k0 * A[r][i] - k1 * A[r0][i];
	    for (var i = 0; i < bcols; i++)
		b[r][i] = k0 * b[r][i] - k1 * b[r0][i];
	}
    }

    for (var r = rows - 1; r >= 0; r--) {
	for (var c = rows - 1; c > r; c--) {
	    var k = A[r][c];
	    A[r][c] = 0;
	    for (var i = 0; i < bcols; i++)
		b[r][i] -= k * b[c][i];
	}
	for (var i = 0; i < bcols; i++)
	    b[r][i] /= A[r][r];
	A[r][r] = 1;
    }

    return b;
}

Warp.prototype.update = function()
{
    if (this.npoints() < 4)
	return;

    var x = this.get_src();
    var y = this.get_dst();
    var H = this.rbf(x, x, true);
    var w = linsolve(H, y);
    for (var i = 0; i < w.length; i++)
	this.w[i] = w[i];
};

Warp.prototype.warp = function(verts)
{
    if (this.npoints() < 4)
	return verts.slice();

    var H = this.rbf(verts, this.get_src())
    var result = [];
    for (var r = 0; r < H.length; r++) {
	var row = [];
	for (var c = 0; c < 2; c++) {
	    var x = 0;
	    for (var i = 0; i < H[r].length; i++)
		x += H[r][i] * this.w[i][c];
	    row.push(x);
	}
	result.push(row);
    }

    return result;
};

// ************************************************************

function Warps()
{
    this.npoints = 0;
    this.src = [];
    this.dst = [];
    for (var i = 0; i < MAX_POINTS; i++) {
	this.src.push([0,0]);
	this.dst.push([0,0]);
    }

    this.warps = [
	new Warp(this, 0, this.src, this.dst),
	new Warp(this, 1, this.dst, this.src)];
}

Warps.prototype = new Object;

Warps.prototype.update = function()
{
    for (var i = 0; i < this.warps.length; i++)
	this.warps[i].update();
};

Warps.prototype.add = function(sx, sy, dx, dy, flip)
{
    if (flip) {
	var tx = sx; sx = dx; dx = tx;
	var ty = sy; sy = dy; dy = ty;
    }

    this.src[this.npoints] = [sx, sy];
    this.dst[this.npoints] = [dx, dy];
    this.npoints++;
    this.update();
};

Warps.prototype.add_pair = function(which, x, y)
{
    var idx = which ? 1 : 0;
    var p = this.warps[idx].warp([[x, y]])[0];
    var dx = p[0];
    var dy = p[1];
    this.add(x, y, dx, dy, which);
};

Warps.prototype.delete = function(idx)
{
    for (var i = idx; i < this.npoints - 1; i++) {
	this.src[i] = this.src[i+1].slice();
	this.dst[i] = this.dst[i+1].slice();
    }
    this.npoints--;
    this.update();
};

// ************************************************************

function Canvas(warp, canvas)
{
    this.warp = warp;

    this.canvas = canvas;
    canvas.setAttribute('tabIndex', warp.which + 1);
    this.ctx = canvas.getContext("webgl");

    this.errors = null;
    this.texture = null;
    this.position_buffer = null;
    this.texcoord_buffer = null;
    this.index_buffer = null;
    this.num_indices = null;
    this.warp_program = null;
    this.drag = null;
    this.radius = 5;

    this.setup();
}

Canvas.prototype.check_error = function()
{
    var gl = this.ctx;

    if (this.errors == null) {
	this.errors = {};
	this.errors[gl.INVALID_ENUM] = 'invalid enum';
	this.errors[gl.INVALID_VALUE] = 'invalid value';
	this.errors[gl.INVALID_OPERATION] = 'invalid operation';
	this.errors[gl.OUT_OF_MEMORY] = 'out of memory';
    }
    for (var i = 0; i < 10; i++) {
        var code = gl.getError();
        if (code == 0)
            return;
        throw Error(this.errors[code]);
    }
};

Canvas.prototype.shader = function(name, type, src)
{
    var gl = this.ctx;

    var shader = gl.createShader(type);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
	throw Error(name + ': ' + gl.getShaderInfoLog(shader));

    return shader;
};

Canvas.prototype.program = function(name, vertex, fragment)
{
    var gl = this.ctx;

    var vertex_src = load_source(vertex);
    var fragment_src = load_source(fragment);

    var vertex_shader = this.shader(name + '.vertex', gl.VERTEX_SHADER, vertex_src);
    var fragment_shader = this.shader(name + '.fragment', gl.FRAGMENT_SHADER, fragment_src);

    var program = gl.createProgram();
    gl.attachShader(program, vertex_shader);
    gl.attachShader(program, fragment_shader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
        throw new Error(gl.getProgramInfoLog(program));

    this.check_error();

    return program;
};

Canvas.prototype.setup_programs = function()
{
    this.warp_program = this.program('warp', 'warp_vertex', 'warp_fragment');
    this.point_program = this.program('points', 'point_vertex', 'point_fragment');
};

Canvas.prototype.make_texture = function(image)
{
    var gl = this.ctx;

    var texture = gl.createTexture();

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    this.check_error();

    return texture;
};

Canvas.prototype.setup_buffers = function()
{
    var gl = this.ctx;

    var position = new Float32Array([-1,-1, 1,-1, 1,1, -1,1]);
    this.position_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.position_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, position, gl.STATIC_DRAW);

    var texcoord = new Float32Array([0,0, 1,0, 1,1, 0,1]);
    this.texcoord_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texcoord_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, texcoord, gl.STATIC_DRAW);

    this.points_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.points_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, MAX_POINTS*2*4, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    this.indices = new Uint16Array([0,1,2, 2,3,0]);
    this.num_indices = this.indices.length;
    this.index_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.index_buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    this.check_error();
};

Canvas.prototype.set_uniform = function(program, variable, func, type, value)
{
    var gl = this.ctx;

    var loc = gl.getUniformLocation(program, variable);

    if (type == 0)
	func.call(gl, loc, value);
    else if (type == 1)
	func.call(gl, loc, new Float32Array(value));
    else
	throw new Error('invalid type');
};

function flatten(a, levels)
{
    if (!levels)
	return a;
    var result = [];
    for (var i = 0; i < a.length; i++) {
	var x = a[i];
	if (levels > 1)
	    x = flatten(x, levels - 1);
	for (var j = 0; j < x.length; j++)
	    result.push(x[j]);
    }
    return result;
}

Canvas.prototype.draw = function()
{
    var gl = this.ctx;

    gl.clearColor(0.5, 0.5, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    if (this.warp.npoints() >= 4) {
	gl.useProgram(this.warp_program);

	this.set_uniform(this.warp_program, 'texture', gl.uniform1i,  0, 0);
	this.set_uniform(this.warp_program, 'warp',    gl.uniform1i,  0, this.warp.which);
	this.set_uniform(this.warp_program, 'npoints', gl.uniform1i,  0, this.warp.npoints());
	this.set_uniform(this.warp_program, 'points',  gl.uniform2fv, 1, flatten(this.warp.src, 1));
	this.set_uniform(this.warp_program, 's2',      gl.uniform1fv, 1, this.warp.s2);
	this.set_uniform(this.warp_program, 'w',       gl.uniform2fv, 1, flatten(this.warp.w, 1));

	gl.activeTexture(gl.TEXTURE0)
	gl.bindTexture(gl.TEXTURE_2D, this.texture);

	var position_attrib = gl.getAttribLocation(this.warp_program, "a_Position");
	var texcoord_attrib = gl.getAttribLocation(this.warp_program, "a_TexCoord");

	gl.enableVertexAttribArray(position_attrib);
	gl.bindBuffer(gl.ARRAY_BUFFER, this.position_buffer);
	gl.vertexAttribPointer(position_attrib, 2, gl.FLOAT, false, 0, 0);

	gl.enableVertexAttribArray(texcoord_attrib);
	gl.bindBuffer(gl.ARRAY_BUFFER, this.texcoord_buffer);
	gl.vertexAttribPointer(texcoord_attrib, 2, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.index_buffer);

	gl.drawElements(gl.TRIANGLES, this.num_indices, gl.UNSIGNED_SHORT, 0);

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

	gl.disableVertexAttribArray(position_attrib);
	gl.disableVertexAttribArray(texcoord_attrib);

	gl.useProgram(null);
    }

    if (this.warp.npoints() > 0) {
	gl.useProgram(this.point_program);

	this.set_uniform(this.point_program, 'radius', gl.uniform1f,  0, this.radius);
	this.set_uniform(this.point_program, 'color',  gl.uniform3fv, 0, [1,0,1]);

	var position_attrib = gl.getAttribLocation(this.point_program, "a_Position");

	var coords = this.warp.get_src()
	gl.enableVertexAttribArray(position_attrib);
	gl.bindBuffer(gl.ARRAY_BUFFER, this.points_buffer);
	gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(flatten(coords, 1)));
	gl.vertexAttribPointer(position_attrib, 2, gl.FLOAT, false, 0, 0);

	gl.drawArrays(gl.POINTS, 0, coords.length);

	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	gl.disableVertexAttribArray(position_attrib);

	gl.useProgram(null);
    }

    gl.flush();

    this.check_error();
};

Canvas.prototype.find_point = function(x, y, sx, sy)
{
    var coords = this.warp.get_src()
    var radius2 = this.radius * this.radius;

    for (var i = 0; i < coords.length; i++) {
	var px = coords[i][0];
	var py = coords[i][1];
	var dx = (px - x) / sx;
	var dy = (py - y) / sy;
	var d2 = dx*dx + dy*dy;
	if (d2 <= radius2)
	    return i;
    }

    return null;
};

Canvas.prototype.mouse_down = function(event)
{
    if (event.button != 0)
	return;

    var rect = this.canvas.getBoundingClientRect();
    var w = rect.right - rect.left;
    var h = rect.bottom - rect.top;
    var sx = 2 / w;
    var sy = 2 / h;
    var x = (event.clientX - rect.left  ) * sx - 1;
    var y = (rect.bottom - event.clientY) * sy - 1;
    var i = this.find_point(x, y, sx, sy);
    if (i == null)
	warps.add_pair(this.warp.which, x, y);
    else if (event.ctrlKey)
	warps.delete(i);
    else {
	var p = this.warp.src[i];
	this.drag = [i, x, y, p[0], p[1]];
    }
    redraw();
};

Canvas.prototype.mouse_up = function(event)
{
    if (event.button != 0)
	return;

    if (this.drag == null)
	return;

    this.drag = null;
    warps.update();
    redraw();
};

Canvas.prototype.mouse_move = function(event)
{
    if (event.button != 0)
	return;

    if (this.drag == null)
	return;

    var rect = this.canvas.getBoundingClientRect();
    var w = rect.right - rect.left;
    var h = rect.bottom - rect.top;
    var x = (event.clientX - rect.left) / w * 2 - 1;
    var y = (rect.bottom - event.clientY) / h * 2 - 1;

    var i  = this.drag[0];
    var x0 = this.drag[1];
    var y0 = this.drag[2];
    var px = this.drag[3];
    var py = this.drag[4];
    var qx = px + x - x0;
    var qy = py + y - y0;

    this.warp.src[i] = [qx, qy];
    warps.update();
    redraw();
};

Canvas.prototype.setup = function()
{
    this.setup_programs();
    this.setup_buffers();
    this.texture = this.make_texture(image);
    this.canvas.onmousedown = this.mouse_down.bind(this);
    this.canvas.onmouseup   = this.mouse_up.bind(this);
    this.canvas.onmousemove = this.mouse_move.bind(this);
};

// ************************************************************

function redraw()
{
    window.requestAnimationFrame(src_c.draw.bind(src_c));
    window.requestAnimationFrame(dst_c.draw.bind(dst_c));
};

function init()
{
    image = document.getElementById("image");
    warps = new Warps();
    src_c = new Canvas(warps.warps[0], document.getElementById("canvas1"));
    dst_c = new Canvas(warps.warps[1], document.getElementById("canvas2"));

    var pairs = [[-0.85, -0.9], [-0.95, 0.9], [0.85, -0.9], [0.95, 0.9]];
    for (var i = 0; i < pairs.length; i++) {
	var x = pairs[i][0];
	var y = pairs[i][1];
	warps.add_pair(0, x, y);
    }
    warps.update();

    redraw();
}

// ************************************************************

