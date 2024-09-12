"use strict";

// ************************************************************

function Gear(length, teeth, radius0, radius1, radius2)
{
    this.length = length;
    this.teeth = teeth;
    this.radius0 = radius0;
    this.radius1 = radius1;
    this.radius2 = radius2;
    this.inverted = this.radius0 > this.radius2;

    this.face_verts = null;
    this.face_norms = null;
    this.face_count = null;
    this.teeth_verts = null;
    this.teeth_norms = null;
    this.teeth_faces = null;
    this.teeth_count = null;
    this.edge_verts = null;
    this.edge_norms = null;
    this.edge_count = null;
}

Gear.prototype = new Object;

Gear.prototype.draw = function(app)
{
    var gl = app.ctx;

    gl.enableVertexAttribArray(app.position_attrib);
    gl.enableVertexAttribArray(app.normal_attrib);

    gl.frontFace(this.inverted ? gl.CCW : gl.CW);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.face_verts[0]);
    gl.vertexAttribPointer(app.position_attrib, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.face_norms[0]);
    gl.vertexAttribPointer(app.normal_attrib, 3, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.face_count);

    gl.frontFace(this.inverted ? gl.CW : gl.CCW);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.face_verts[1]);
    gl.vertexAttribPointer(app.position_attrib, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.face_norms[1]);
    gl.vertexAttribPointer(app.normal_attrib, 3, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.face_count);

    gl.frontFace(this.inverted ? gl.CW : gl.CCW);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.teeth_verts);
    gl.vertexAttribPointer(app.position_attrib, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.teeth_norms);
    gl.vertexAttribPointer(app.normal_attrib, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.teeth_faces);
    gl.drawElements(gl.TRIANGLES, this.teeth_count, gl.UNSIGNED_SHORT, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.edge_verts);
    gl.vertexAttribPointer(app.position_attrib, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.edge_norms);
    gl.vertexAttribPointer(app.normal_attrib, 3, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.edge_count);
};

Gear.prototype.create = function(app)
{
    var r0 = this.radius0;
    var pts0 = [];
    var pts1 = [];
    for (i = 0; i < this.teeth * 2; i++) {
	var r1 = i % 2 != 0 ? this.radius2 : this.radius1;
	var a = i * Math.PI / this.teeth;
	var c = Math.cos(a);
	var s = Math.sin(a);
	pts0.push([r0 * c, r0 * s]);
	pts1.push([r1 * c, r1 * s]);
    }

    pts0.push(pts0[0]);
    pts1.push(pts1[0]);

    var d = this.length / 2;

    var vertices = [];
    var normals = [];

    for (var j = 0; j < 2; j++) {
	var z = (2 * j - 1);
	var normal = [0, 0, z];
	var verts = [];
	var norms = [];
	var dz = z*d;
	for (var i = 0; i < pts0.length; i++) {
	    var p0 = pts0[i];
	    var p1 = pts1[i];
	    var x0 = p0[0];
	    var y0 = p0[1];
	    var x1 = p1[0];
	    var y1 = p1[1];
	    verts.push([x0,y0,dz]);
	    verts.push([x1,y1,dz]);
	    norms.push(normal);
	    norms.push(normal);
	}

	vertices.push(app.array_buffer(verts, 1));
	normals.push(app.array_buffer(norms, 1));
    }

    this.face_verts = vertices;
    this.face_norms = normals;
    this.face_count = pts0.length * 2;

    var x0 = null;
    var y0 = null;
    var z = this.length / 2;
    var vertices = [];
    var normals = [];
    var indices = []
    for (var i = 0; i < pts1.length; i++) {
	var p1 = pts1[i];
	var x1 = p1[0];
	var y1 = p1[1];
	if (x0 != null) {
	    var normal = !this.inverted
		? [(y1 - y0) * z, -(x1 - x0) * z, 0]
                : [-(y1 - y0) * z, (x1 - x0) * z, 0];
	    for (var j = 0; j < 4; j++)
		normals.push(normal);

	    var i0 = vertices.length;
	    vertices.push([x0, y0,  z]);
	    vertices.push([x0, y0, -z]);
	    vertices.push([x1, y1, -z]);
	    vertices.push([x1, y1,  z]);

	    indices.push([i0+0, i0+1, i0+2, i0+2, i0+3, i0+0]);
	}

	x0 = x1;
	y0 = y1;
    }

    this.teeth_verts = app.array_buffer(vertices, 1);
    this.teeth_norms = app.array_buffer(normals, 1);
    this.teeth_faces = app.index_buffer(indices, 1);
    this.teeth_count = indices.length * 6;

    var vertices = [];
    var normals = [];
    for (var i = 0; i < pts0.length; i++) {
	var p0 = pts0[i];
	var x = p0[0];
	var y = p0[1];
	var normal = !this.inverted
	    ? [-x, -y, 0]
            : [ x,  y, 0];
	normals.push(normal);
	normals.push(normal);
	vertices.push([x, y,-d]);
	vertices.push([x, y, d]);
    }

    this.edge_verts = app.array_buffer(vertices, 1);
    this.edge_norms = app.array_buffer(normals, 1);
    this.edge_count = vertices.length;
};

// ************************************************************

function Epicyclic(length, pitch, axle, teeth1, teeth2, thickness)
{
    this.length = length;
    this.pitch = pitch;
    this.axle = axle;
    this.inner_teeth = teeth1;
    this.middle_teeth = teeth2;
    this.outer_teeth = this.inner_teeth + 2 * this.middle_teeth;
    this.thickness = thickness;

    this.inner = this.make(this.inner_teeth);
    this.middle = this.make(this.middle_teeth);
    this.outer = this.make(this.outer_teeth, this.thickness);

    this.inner_rot = 180.0 / this.inner_teeth;
    this.outer_rot = 0;
    this.carrier_rot = 0;
    this.middle_rot = [0, 0, 0];

    this.lock = this.ANNULUS;
    this.drive = this.CENTER;
    this.speed = 10;
}

Epicyclic.prototype = new Object;

Epicyclic.prototype.names = ["center", "annulus", "carrier"];

Epicyclic.prototype.CENTER  = 0;
Epicyclic.prototype.ANNULUS = 1;
Epicyclic.prototype.CARRIER = 2;

Epicyclic.prototype.make = function(teeth, ring)
{
    var c = teeth * this.pitch;
    var r = c / (2 * Math.PI);
    var d = this.pitch / 2;
    if (ring == null)
	ring = this.axle;
    else
	ring += r + d;

    return new Gear(this.length, teeth, ring, r - d, r + d);
};

Epicyclic.prototype.create = function(app)
{
    this.inner.create(app);
    this.outer.create(app);
    this.middle.create(app);
};

Epicyclic.prototype.draw = function(app, mv_matrix)
{
    var gl = app.ctx;

    app.set_color(1, 0, 0);
    var m = mv_matrix.postmultiplied(Matrix.rotz(this.inner_rot, true));
    app.set_matrix(m);
    this.inner.draw(app);

    app.set_color(0, 1, 0);
    var m = mv_matrix.postmultiplied(Matrix.rotz(this.outer_rot, true));
    app.set_matrix(m);
    this.outer.draw(app)

    app.set_color(0, 0, 1);

    var m0 = mv_matrix.postmultiplied(Matrix.rotz(this.carrier_rot, true));
    for (var i = 0; i < 3; i++) {
	var m = new Matrix(m0);
	m.postmultiply(Matrix.rotz( i * 120, true));
	m.postmultiply(Matrix.translate(this.inner.radius1 + this.middle.radius2, 0, 0));
	m.postmultiply(Matrix.rotz(-i * 120, true));
	m.postmultiply(Matrix.rotz(-this.carrier_rot, true));
	m.postmultiply(Matrix.rotz(this.middle_rot[i], true));
	app.set_matrix(m);
	this.middle.draw(app);
    }
};

Epicyclic.prototype.rotate = function(t, inner, middle, carrier, outer)
{
    var n = this.inner_teeth/this.middle_teeth;

    if (inner == null && middle == null) {
	inner   = (2*(n+1)*carrier - (n+2)*outer)/n;
	middle  = (n+2)*outer - (n+1)*carrier;
    }
    else if (inner == null && carrier == null) {
	inner   = ((n+2)*outer - 2*middle)/n;
	carrier = ((n+2)*outer - middle)/(n+1);
    }
    else if (inner == null && outer == null) {
	inner   = ((n+1)*carrier - middle)/n;
	outer   = ((n+1)*carrier + middle)/(n+2);
    }
    else if (middle == null && carrier == null) {
	middle  = ((n+2)*outer - n*inner)/2;
	carrier = ((n+2)*outer + n*inner)/(2*(n+1));
    }
    else if (middle == null && outer == null) {
	middle  = (n+1)*carrier - n*inner;
	outer   = (2*(n+1)*carrier - n*inner)/(n+2);
    }
    else if (carrier == null && outer == null) {
	carrier = (n*inner + middle)/(n+1);
	outer   = (n*inner + 2*middle)/(n+2);
    }
    else
	throw new Error("NotImplemented");

    var speed = t * Math.pow(1.3, this.speed);

    this.inner_rot += inner * speed;
    this.outer_rot += outer * speed;
    this.carrier_rot += carrier * speed;

    for (var i = 0; i < 3; i++)
	this.middle_rot[i] += middle * speed;
};

Epicyclic.prototype.update = function(t)
{
    var inner = null;
    var outer = null;
    var carrier = null;

    if (this.lock == this.CENTER)
	inner = 0;
    else if (this.lock == this.CARRIER)
	carrier = 0;
    else if (this.lock == this.ANNULUS)
	outer = 0;

    if (this.drive == this.CENTER)
	inner = 1;
    else if (this.drive == this.CARRIER)
	carrier = 1;
    else if (this.drive == this.ANNULUS)
	outer = 1;

    this.rotate(t, inner, null, carrier, outer);
};

// ************************************************************

function Application(canvas)
{
    WebGLApp.call(this, canvas);
}

Application.prototype = Object.create(WebGLApp.prototype);

Application.prototype.init = function()
{
    this.start_object_rot = [0, 0,  0];
    this.start_object_pos = [0, 0,-10];
    this.start_light_pos  = [8, 4,  0];

    this.obj = null;
    this.program = null;
    this.v_matrix_m = null;
    this.v_matrix_p = null;
    this.v_matrix_n = null;
    this.v_color = null;
    this.v_shininess = null;
};

Application.prototype.setup = function()
{
    this.obj = new Epicyclic(1.0, 0.3, 0.5, 48, 48, 0.3);
    this.obj.create(this);
    this.setup_program();
    this.check_error();
    this.update_page();
};

Application.prototype.setup_program = function()
{
    var gl = this.ctx;

    this.program = this.create_program('vshader', 'fshader');

    this.v_matrix_m = gl.getUniformLocation(this.program, 'modelview_matrix');
    this.v_matrix_p = gl.getUniformLocation(this.program, 'projection_matrix');
    this.v_matrix_n = gl.getUniformLocation(this.program, 'normal_matrix');
    this.v_light_pos = gl.getUniformLocation(this.program, 'light_pos');
    this.v_color = gl.getUniformLocation(this.program, 'color');
    this.v_shininess = gl.getUniformLocation(this.program, 'shininess');

    this.position_attrib = gl.getAttribLocation(this.program, "a_position");
    this.normal_attrib = gl.getAttribLocation(this.program, "a_normal");
};

Application.prototype.set_color = function(r, g, b)
{
    var gl = this.ctx;
    gl.uniform3f(this.v_color, r, g, b);
};

Application.prototype.set_matrix = function(m)
{
    var gl = this.ctx;
    var c = m.as_array();
    var n = [c[0], c[1], c[2],
	     c[4], c[5], c[6],
	     c[8], c[9], c[10]];

    gl.uniformMatrix4fv(this.v_matrix_m, false, new Float32Array(c));
    gl.uniformMatrix3fv(this.v_matrix_n, false, new Float32Array(n));
};

Application.prototype.change_speed = function(dir)
{
    this.obj.speed += dir;
};

Application.prototype.draw = function()
{
    var gl = this.ctx;
    gl.clearColor(0.5, 0.5, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.useProgram(this.program);

    gl.uniform3fv(this.v_light_pos, new Float32Array(this.light_pos));
    gl.uniform1f(this.v_shininess, 10);

    var p = Matrix.perspective(90, this.canvas.height / this.canvas.width, 0.1, 50.0);
    gl.uniformMatrix4fv(this.v_matrix_p, false, new Float32Array(p.as_array()));

    var m = new Matrix();
    m.postmultiply(Matrix.translate(this.object_pos));
    m.postmultiply(Matrix.rotx(this.object_rot[0], true));
    m.postmultiply(Matrix.roty(this.object_rot[1], true));
    m.postmultiply(Matrix.rotz(this.object_rot[2], true));

    this.obj.draw(this, m);
    gl.flush();
    
    this.check_error();
};

Application.prototype.update = function(t)
{
    this.obj.update(t);
};

Application.prototype.update_page = function()
{
    for (var i = 0; i < 3; i++) {
	var name = this.obj.names[i];
	var element = document.getElementById("drive_" + name);
	element.style.setProperty("background", (this.obj.drive == i) ? "#00ffff" : "#ffffff");
    }

    for (var i = 0; i < 3; i++) {
	var name = this.obj.names[i];
	var element = document.getElementById("lock_" + name);
	element.style.setProperty("background", (this.obj.lock == i) ? "#00ffff" : "#ffffff");
    }
};

Application.prototype.set_drive = function(which)
{
    var id = null;
    for (var i = 0; i < 3; i++) {
	if (this.obj.names[i] == which)
	    id = i;
    }
    if (id == null)
	return;
    if (id == this.obj.drive)
	return;
    if (id == this.obj.lock)
	this.obj.lock = this.obj.drive;
    this.obj.drive = id;
    this.update_page();
};

Application.prototype.set_lock = function(which)
{
    var id = null;
    for (var i = 0; i < 3; i++) {
	if (this.obj.names[i] == which)
	    id = i;
    }
    if (id == null)
	return;
    if (id == this.obj.lock)
	return;
    if (id == this.obj.drive)
	this.obj.drive = this.obj.lock;
    this.obj.lock = id;
    this.update_page();
};

// ************************************************************

var app = null;

function init()
{
    var canvas = document.getElementById("canvas");
    app = new Application(canvas);
    setInterval(app.refresh.bind(app), 15);
}

// ************************************************************

