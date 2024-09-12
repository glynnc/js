"use strict";

// ************************************************************

function Application(canvas)
{
    WebGLApp.call(this, canvas);
}

Application.prototype = Object.create(WebGLApp.prototype);

Application.prototype.init = function()
{
    this.start_object_pos = [1, 4, 8, 1];
    this.start_camera_pos = [0, 2, 0, 1];
    this.start_camera_rot = [0, 0, 0];

    this.camera_rot = this.start_camera_rot.slice();
    this.camera_pos = this.start_camera_pos.slice();

    this.mode = 0;
    this.shape = false;

    this.background_src = null;
    this.empty_prog = null;
    this.sphere_prog = null;
    this.obj_prog = null;

    this.sky_tex = null;
    this.gnd_tex = null;

    this.quad_verts = null;
    this.quad_indices  = null;
    this.quad_num_indices = null;

    this.obj_verts = null;
    this.obj_indices  = null;
    this.obj_num_indices = null;
};

WebGLApp.prototype.create_program = function(vertex, fragment)
{
    var gl = this.ctx;

    var vertex_src = this.load_source(vertex);
    var fragment_src = this.load_source(fragment);
    fragment_src = this.background_src + "\n" + fragment_src;

    var vertex_shader = this.shader(vertex, gl.VERTEX_SHADER, vertex_src);
    var fragment_shader = this.shader(fragment, gl.FRAGMENT_SHADER, fragment_src);

    var program = this.make_program(vertex_shader, fragment_shader);

    this.check_error();

    return program;
};

Application.prototype.setup_programs = function()
{
    this.background_src = this.load_source("fshader_bg");
    this.empty_prog  = this.create_program("vshader_sphere", "fshader_empty");
    this.sphere_prog = this.create_program("vshader_sphere", "fshader_sphere");
    this.obj_prog    = this.create_program("vshader_obj",    "fshader_obj");
};

Application.prototype.setup_textures = function()
{
    this.sky_tex = this.load_texture("sky");
    this.gnd_tex = this.load_texture("ground");
};

Application.prototype.setup_buffers = function(obj)
{
    var gl = this.ctx;

    var quad_verts = [ 1, 1, 1,  -1, 1, 1,  1,-1, 1,  -1,-1, 1];
    var quad_ix = [0,1,3,3,2,0];
    this.quad_verts   = this.array_buffer(quad_verts);
    this.quad_indices = this.index_buffer(quad_ix);
    this.quad_num_indices = quad_ix.length;

    this.obj_verts    = this.array_buffer(monkey_verts);
    this.obj_norms    = this.array_buffer(monkey_norms);
    this.obj_indices  = this.index_buffer(monkey_faces);
    this.obj_num_indices = monkey_faces.length;

    this.check_error();
};

Application.prototype.rotation = function()
{
    var m = Matrix.identity();
    m.postmultiply(Matrix.rotz(this.camera_rot[2], true));
    m.postmultiply(Matrix.roty(this.camera_rot[1], true));
    m.postmultiply(Matrix.rotx(this.camera_rot[0], true));
    return m;
}

Application.prototype.setup = function()
{
    this.setup_programs();
    this.setup_textures();
    this.setup_buffers();
};

Application.prototype.draw_obj = function()
{
    var gl = this.ctx;
    var w = this.canvas.width;
    var h = this.canvas.height;

    var m = Matrix.translate(this.camera_pos.slice(0,3));
    m.postmultiply(this.rotation());
    m.postmultiply(Matrix.scale(w/h, 1, 1));

    var mfwd = new Float32Array(m.as_array());
    var mrev = new Float32Array(m.inverse().as_array());

    var p = new Matrix([1,0,0,0,  0,1,0,0,  0,0,1,-0.1,  0,0,1,0]);
    var mproj = new Float32Array(p.as_array());

    gl.disable(gl.DEPTH_TEST);
    gl.depthMask(gl.FALSE);

    gl.useProgram(this.empty_prog);

    this.set_textures(this.empty_prog);

    gl.uniformMatrix4fv(gl.getUniformLocation(this.empty_prog, 'matrix'), false, mfwd);

    var a_position = gl.getAttribLocation(this.empty_prog, 'vertex');
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad_verts);
    gl.vertexAttribPointer(a_position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_position);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.quad_indices);
    gl.drawElements(gl.TRIANGLES, this.quad_num_indices, gl.UNSIGNED_SHORT, 0);

    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(gl.TRUE);

    gl.useProgram(this.obj_prog);

    this.set_textures(this.obj_prog);

    gl.uniformMatrix4fv(gl.getUniformLocation(this.obj_prog, 'mview'), false, mrev);
    gl.uniformMatrix4fv(gl.getUniformLocation(this.obj_prog, 'mproj'), false, mproj);
    gl.uniform4fv(gl.getUniformLocation(this.obj_prog, 'camera'), new Float32Array(this.camera_pos));
    gl.uniform4fv(gl.getUniformLocation(this.obj_prog, 'object'), new Float32Array(this.object_pos));
    gl.uniform1i(gl.getUniformLocation(this.obj_prog, 'mode'), this.mode);

    var a_position = gl.getAttribLocation(this.obj_prog, 'vertex');
    var a_normal   = gl.getAttribLocation(this.obj_prog, 'normal');
    gl.bindBuffer(gl.ARRAY_BUFFER, this.obj_verts);
    gl.vertexAttribPointer(a_position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_position);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.obj_norms);
    gl.vertexAttribPointer(a_normal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_normal);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.obj_indices);
    gl.drawElements(gl.TRIANGLES, this.obj_num_indices, gl.UNSIGNED_SHORT, 0);

    gl.useProgram(null);

    gl.flush();

    this.check_error();
};

Application.prototype.draw_sphere = function()
{
    var gl = this.ctx;
    var w = this.canvas.width;
    var h = this.canvas.height;

    gl.disable(gl.DEPTH_TEST);
    gl.useProgram(this.sphere_prog);

    this.set_textures(this.sphere_prog);

    // m = Matrix.perspective(90.0, float(this.w)/float(this.h), 0.1, 100.0);
    var m = Matrix.translate(this.camera_pos.slice(0,3));
    m.postmultiply(this.rotation());
    m.postmultiply(Matrix.scale(w/h, 1, 1));
    m = new Float32Array(m.as_array());

    gl.uniform1f(gl.getUniformLocation(this.sphere_prog, 'radius'), 3);
    gl.uniform4fv(gl.getUniformLocation(this.sphere_prog, 'center'), this.object_pos);
    gl.uniformMatrix4fv(gl.getUniformLocation(this.sphere_prog, 'matrix'), false, m);
    gl.uniform1i(gl.getUniformLocation(this.sphere_prog, 'mode'), this.mode);

    var a_position = gl.getAttribLocation(this.sphere_prog, 'vertex');
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad_verts);
    gl.vertexAttribPointer(a_position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_position);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.quad_indices);
    gl.drawElements(gl.TRIANGLES, this.quad_num_indices, gl.UNSIGNED_SHORT, 0);

    gl.useProgram(null);

    gl.flush();

    this.check_error();
};

Application.prototype.set_textures = function(prog)
{
    var gl = this.ctx;

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.sky_tex);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.gnd_tex);

    gl.uniform1i(gl.getUniformLocation(prog, 'sky'), 0);
    gl.uniform1i(gl.getUniformLocation(prog, 'ground'), 1);
    gl.uniform2f(gl.getUniformLocation(prog, 'size'), 1, 1);
};

Application.prototype.draw = function()
{
    var gl = this.ctx;

    gl.clear(gl.DEPTH_BUFFER_BIT);

    if (this.shape != 0)
	this.draw_obj();
    else
	this.draw_sphere();
};

// ************************************************************

Application.prototype.change_shape = function()
{
    this.shape = !this.shape;
};

Application.prototype.change_mode = function()
{
    this.mode++;
    this.mode %= 4;
};

Application.prototype.set_mode = function(mode)
{
    this.mode = mode;
};

// ************************************************************

Application.prototype.handle_keys = function(t)
{
    var rot = 45;
    var move = 3.0;
    var fov = 5.0;

    if (this.key_state["Control"]) {
        if (this.key_state["Left"])      this.object_pos[0] -= move * t;
        if (this.key_state["Right"])     this.object_pos[0] += move * t;
        if (this.key_state["Down"])      this.object_pos[1] -= move * t;
        if (this.key_state["Up"])        this.object_pos[1] += move * t;
        if (this.key_state["PageDown"])  this.object_pos[2] -= move * t;
        if (this.key_state["PageUp"])    this.object_pos[2] += move * t;
    }
    else if (this.key_state["Shift"]) {
        if (this.key_state["Down"])      this.camera_rot[0] += rot * t;
        if (this.key_state["Up"])        this.camera_rot[0] -= rot * t;
        if (this.key_state["Right"])     this.camera_rot[1] += rot * t;
        if (this.key_state["Left"])      this.camera_rot[1] -= rot * t;
        if (this.key_state["PageDown"])  this.camera_rot[2] += rot * t;
        if (this.key_state["PageUp"])    this.camera_rot[2] -= rot * t;
    }
    else {
	var s = move * t;
	var m = Matrix.multiply(this.rotation(), Matrix.scale(s, s, s));
        if (this.key_state["Left"])      this.camera_pos = vector_add(this.camera_pos, m.transform([-1, 0, 0, 1]));
        if (this.key_state["Right"])     this.camera_pos = vector_add(this.camera_pos, m.transform([ 1, 0, 0, 1]));
        if (this.key_state["Down"])      this.camera_pos = vector_add(this.camera_pos, m.transform([ 0, 0,-1, 1]));
        if (this.key_state["Up"])        this.camera_pos = vector_add(this.camera_pos, m.transform([ 0, 0, 1, 1]));
        if (this.key_state["PageDown"])  this.camera_pos = vector_add(this.camera_pos, m.transform([ 0,-1, 0, 1]));
        if (this.key_state["PageUp"])    this.camera_pos = vector_add(this.camera_pos, m.transform([ 0, 1, 0, 1]));
	this.camera_pos[3] = 1.0;
	this.camera_pos[1] = Math.max(this.camera_pos[1], 0.1);
    }
};

Application.prototype.key_press = function(event)
{
    WebGLApp.prototype.key_press.call(this, event);

    var key = event.key;
    if (key.startsWith("Arrow"))
	key = key.substr(5);

    if (key == "Home") {
        if (event.ctrlKey)
            this.camera_rot = this.start_camera_rot.slice();
	else if (event.shiftKey)
            this.object_pos = this.start_object_pos.slice();
        else
            this.camera_pos = this.start_camera_pos.slice();
    }

    key = key.toLowerCase();

    if (key == 'm') {
	this.change_mode();
    }
    else if (key == 's') {
	this.change_shape();
    }
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

