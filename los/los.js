"use strict";

// ************************************************************

function Application(canvas)
{
    WebGLApp.call(this, canvas);
}

Application.prototype = Object.create(WebGLApp.prototype);

Application.prototype.init = function()
{
    this.camera_pos = null;

    this.map = null;
    this.tile_width = null;
    this.tile_height = null;
    this.view_width = null;
    this.view_height = null;

    this.program = null;

    this.v_texture = null;
    this.v_color   = null;
    this.v_matrix  = null;

    this.a_position = null;
    this.a_texcoord = null;

    this.texture = null;
    this.blank = null;

    this.verts = null;
    this.texco = null;
    this.indices = null;
    this.num_indices = null;

    this.los_buffer = null;
    this.los_size = null;
};

Application.prototype.setup_texture = function()
{
    this.texture = this.load_texture("tiles");
    this.blank = this.load_texture("blank");
};

Application.prototype.setup_program = function()
{
    var gl = this.ctx;

    this.program = this.create_program("vshader", "fshader");

    this.v_texture = gl.getUniformLocation(this.program, 'texture');
    this.v_color   = gl.getUniformLocation(this.program, 'color');
    this.v_matrix  = gl.getUniformLocation(this.program, 'mvp_matrix');

    this.a_position = gl.getAttribLocation(this.program, 'a_position');
    this.a_texcoord = gl.getAttribLocation(this.program, 'a_texcoord');
};

Application.prototype.setup_map = function()
{
    var w = 100;
    var h = 80;

    var tw = 32;
    var th = 32;

    var data = [];
    for (var y = 0; y < h; y++) {
        var row = [];
        for (var x = 0; x < w; x++) {
            var t = Math.floor(Math.random() * 10);
            t = (t == 9) ? 3 : t % 3;
            row.push(t);
        }
        data.push(row);
    }

    this.map = {};
    this.map.data = data;
    this.map.height = h;
    this.map.width  = w;

    this.tile_width = tw;
    this.tile_height = th;

    this.view_width = this.canvas.width / tw;
    this.view_height = this.canvas.height / th;

    this.camera_pos = [w / 2, h / 2, 0];
};

Application.prototype.setup_buffers = function(obj)
{
    var tiles_x = 2;
    var tiles_y = 2;

    var verts = [];
    var texco = [];
    var faces = [];

    var stride = this.map.width + 1;

    for (var y = 0; y < this.map.height; y++) {
        for (var x = 0; x < this.map.width; x++) {
            var f = verts.length;
            var t = this.map.data[y][x];
            var tx = t % tiles_x;
            var ty = Math.floor(t / tiles_x);

            for (var j = 0; j < 2; j++) {
                for (var i = 0; i < 2; i++) {
                    verts.push([x + i,y + j]);
                    texco.push([(tx + i) / tiles_x, (ty + j) / tiles_y]);
                }
            }

            faces.push([f+0, f+1, f+2, f+2, f+1, f+3]);
        }
    }

    faces = this.flatten(faces, 1);

    this.verts    = this.array_buffer(verts, 1);
    this.texco    = this.array_buffer(texco, 1);
    this.indices  = this.index_buffer(faces);
    this.num_indices = faces.length;

    this.check_error();
};

Application.prototype.setup = function()
{
    this.setup_program();
    this.setup_texture();
    this.setup_map();
    this.setup_buffers();
};

Application.prototype.draw = function()
{
    var gl = this.ctx;

    var width  = this.view_width;
    var height = this.view_height;
    var mvp = Matrix.ortho(0, width, 0, height, -1, 1);
    var dx = this.camera_pos[0] - width / 2;
    var dy = this.camera_pos[1] - height / 2;
    mvp.postmultiply(Matrix.translate(-dx, -dy, 0));

    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.bindTexture(gl.TEXTURE_2D, this.texture);

    gl.useProgram(this.program);

    gl.uniform1i(this.v_texture, 0);
    var k = 0.4;
    gl.uniform4fv(this.v_color, [1,1,1,1]);
    gl.uniformMatrix4fv(this.v_matrix, false, new Float32Array(mvp.as_array()));

    gl.bindBuffer(gl.ARRAY_BUFFER, this.verts);
    gl.vertexAttribPointer(this.a_position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(this.a_position);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.texco);
    gl.vertexAttribPointer(this.a_texcoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(this.a_texcoord);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indices);
    gl.drawElements(gl.TRIANGLES, this.num_indices, gl.UNSIGNED_SHORT, 0);



    gl.bindTexture(gl.TEXTURE_2D, this.blank);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.uniform4fv(this.v_color, [1,1,1,0.3]);

    var los_verts = this.los();
    var array = new Float32Array(this.flatten(los_verts, 1));
    if (this.los_size == null) {
	this.los_buffer = gl.createBuffer();
	this.los_size = 0;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, this.los_buffer);
    if (this.los_size < los_verts.length)
	gl.bufferData(gl.ARRAY_BUFFER, array, gl.STATIC_DRAW);
    else
	gl.bufferSubData(gl.ARRAY_BUFFER, 0, array);

    gl.vertexAttribPointer(this.a_position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(this.a_position);

    gl.disableVertexAttribArray(this.a_texcoord);

    gl.drawArrays(gl.TRIANGLES, 0, los_verts.length);

    gl.disable(gl.BLEND);


    gl.useProgram(null);

    gl.bindTexture(gl.TEXTURE_2D, null);

    gl.flush();

    this.check_error();
};

Application.prototype.slice = function(l, r)
{
    var s = {};
    s.l = l;
    s.r = r;
    return s;
};

Application.prototype.los0 = function(x0, y0, h, xmax, ymax, dirx, diry, flip)
{
    var ox = Math.floor(x0);
    var oy = Math.floor(y0);

    var done = [];

    var m = flip([ox+dirx,oy]);
    var b = this.map.data[m[1]][m[0]] == 3;
    var t = 1;

    if (b) {
	var px = dirx > 0 ? ox+1 : ox;
	var py = diry > 0 ? oy+1 : oy;
	var dx = Math.abs(x0-px);
	var dy = Math.abs(y0-py);
	if (dx < dy) {
	    t = dx / dy;
	    var y = y0 + diry * dx;
	    done.push(this.slice([px,py], [px,y]));
	}
    }

    var all = this.slice(0, t);
    var open = [all];

    for (var ky = 1; ky <= h; ky++) {
        var y = oy + diry * ky;
	var py = y + (diry < 0 ? 1 : 0);
        var dy = diry * (py - y0);

	if (y < 0 || y >= ymax)
	    continue;

        for (var kx = 0; kx <= ky + 1; kx++) {
            var x = ox + dirx * kx;
	    var px = x + (dirx < 0 ? 1 : 0);
            var dx = dirx * (px - x0);

	    if (x < 0 || x >= xmax)
		continue;

	    var m = flip([x,y]);
            var b = this.map.data[m[1]][m[0]] == 3;
            if (!b)
                continue;

            var t00 = (dx + 0) / (dy + 0);
            var t01 = (dx + 1) / (dy + 0);
            var t10 = (dx + 0) / (dy + 1);
            var t0 = Math.min(t00,t10);
            var t1 = t01;

            var nopen = [];

            for (var idx = 0; idx < open.length; idx++) {
                var s = open[idx];
                var l = s.l;
                var r = s.r;

                if (r <= t0 || l >= t1) {
                    nopen.push(s);
                    continue;
                }

                if (l < t0) {
                    var ss = this.slice(l, t0);
                    nopen.push(ss);
                    l = t0;
                }
                if (r > t1) {
                    var ss = this.slice(t1, r);
                    nopen.push(ss);
                    r = t1;
                }

                var vl = (l < t00) ? [px, y0+diry*dx/l] : [x0+dirx*dy*l, py];
                var vr = (r < t00) ? [px, y0+diry*dx/r] : [x0+dirx*dy*r, py];

                if (l < t00 && r > t00) {
                    var vc = [px, py];
                    done.push(this.slice(vl, vc));
                    done.push(this.slice(vc, vr));
                }
                else
                    done.push(this.slice(vl, vr));
            }

            open = nopen;
        }
    }

    var y1 = y0 + diry * h;
    for (var i = 0; i < open.length; i++) {
        var s = open[i];
        var l = s.l;
        var r = s.r;
        var xl = x0 + dirx * l * h;
        var xr = x0 + dirx * r * h;
        var v0 = [xl, y1];
        var v1 = [xr, y1];
        var ns = this.slice(v0, v1);
        done.push(ns);
    }

    var verts = [];

    for (var i = 0; i < done.length; i++) {
        var s = done[i];
        verts.push(flip([x0,y0]));
        verts.push(flip(s.l));
        verts.push(flip(s.r));
    }

    return verts;
};

Application.prototype.los = function()
{
    var x0 = this.camera_pos[0];
    var y0 = this.camera_pos[1];
    var vw = this.view_width;
    var vh = this.view_height;
    var mw = this.map.width;
    var mh = this.map.height;
    var xyflip = function(p) { return [p[1],p[0]]; };
    var noflip = function(p) { return p; };
    var v = [this.los0(x0, y0, vh, mw, mh,  1,  1, noflip),
	     this.los0(x0, y0, vh, mw, mh, -1,  1, noflip),
	     this.los0(x0, y0, vh, mw, mh,  1, -1, noflip),
	     this.los0(x0, y0, vh, mw, mh, -1, -1, noflip),
	     this.los0(y0, x0, vw, mh, mw,  1,  1, xyflip),
	     this.los0(y0, x0, vw, mh, mw, -1,  1, xyflip),
	     this.los0(y0, x0, vw, mh, mw,  1, -1, xyflip),
	     this.los0(y0, x0, vw, mh, mw, -1, -1, xyflip)];
    return this.flatten(v, 1);
};

Application.prototype.handle_keys = function(t)
{
    var move = 3.0;

    if (this.key_state["Left"])      this.camera_pos[0] -= move * t;
    if (this.key_state["Right"])     this.camera_pos[0] += move * t;
    if (this.key_state["Down"])      this.camera_pos[1] -= move * t;
    if (this.key_state["Up"])        this.camera_pos[1] += move * t;
    this.camera_pos[0] = Math.max(Math.min(this.camera_pos[0], this.map.width  - this.view_width  / 2), this.view_width  / 2);
    this.camera_pos[1] = Math.max(Math.min(this.camera_pos[1], this.map.height - this.view_height / 2), this.view_height / 2);
};

// ************************************************************

var app = null;

function init()
{
    var canvas = document.getElementById("canvas");
    app = new Application(canvas);
    setInterval(app.refresh.bind(app), 20);
}

// ************************************************************

