"use strict";

// ************************************************************

function Application(canvas)
{
    WebGLApp.call(this, canvas);
}

Application.prototype = Object.create(WebGLApp.prototype);

Application.prototype.init = function()
{
    this.program = null;
    this.shadow_prog = null;

    this.ambient = [0.0, 0.1, 0.0];
    this.diffuse = [0.1, 0.8, 0.1];
    this.specular = [0.8, 0.8, 0.8];
    this.shininess = 10.0;

    this.shadow_width = 256;
    this.shadow_height = 256;

    this.color_buf = null;
    this.depth_buf = null;
    this.framebuffer = null;

    this.verts = null;
    this.norms = null;
    this.indices  = null;
    this.num_indices = null;
    this.box = null;
};

Application.prototype.setup_programs = function()
{
    this.program     = this.create_program("vshader", "fshader");
    this.shadow_prog = this.create_program("vshader_shadow", "fshader_shadow");
};

Application.prototype.setup_framebuffer = function()
{
    var gl = this.ctx;

    var width = this.shadow_width;
    var height = this.shadow_height;

    this.color_buf = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.color_buf);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, width, height, 0,
		  gl.RGB, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.bindTexture(gl.TEXTURE_2D, null);

    this.depth_buf = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.depth_buf);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT, width, height, 0,
		  gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.bindTexture(gl.TEXTURE_2D, null);

    this.framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, this.depth_buf, 0);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.color_buf, 0);
    status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status != gl.FRAMEBUFFER_COMPLETE)
	throw Error("framebuffer error: " + status.toString(16));
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    this.check_error();
};

Application.prototype.setup_box = function(obj)
{
    var bounds = [[ 1e30,  1e30,  1e30],
		  [-1e30, -1e30, -1e30]];
    for (var i = 0; i < scene_verts.length; i += 3) {
	for (var axis = 0; axis < 3; axis++) {
	    var x = scene_verts[i + axis];
	    bounds[0][axis] = Math.min(bounds[0][axis], x);
	    bounds[1][axis] = Math.max(bounds[1][axis], x);
	}
    }

    var box = [];
    for (var x = 0; x < 2; x++) {
	for (var y = 0; y < 2; y++) {
	    for (var z = 0; z < 2; z++) {
		var p = [bounds[x][0], bounds[y][1], bounds[z][2]];
		box.push(p);
	    }
	}
    }

    this.box = box;
};

Application.prototype.setup_buffers = function(obj)
{
    var gl = this.ctx;

    this.verts    = this.array_buffer(scene_verts);
    this.norms    = this.array_buffer(scene_norms);
    this.indices  = this.index_buffer(scene_faces);
    this.num_indices = scene_faces.length;

    this.check_error();
};

Application.prototype.setup = function()
{
    var gl = this.ctx;
    gl.getExtension("WEBGL_depth_texture");

    this.setup_box();
    this.setup_programs();
    this.setup_framebuffer();
    this.setup_buffers();
};

Application.prototype.shadow_matrix = function()
{
    var eye = this.light_pos.slice(0,3);
    var target = this.object_pos.slice(0,3);
    var up = [0, 1, 0];

    var mview = Matrix.lookat(eye, target, up);
    mview.postmultiply(Matrix.translate(this.object_pos));
    mview.postmultiply(Matrix.rotx(this.object_rot[0], true));
    mview.postmultiply(Matrix.roty(this.object_rot[1], true));
    mview.postmultiply(Matrix.rotz(this.object_rot[2], true));

    var x0 = 1e30, y0 = 1e30, z0 = 1e30;
    var x1 =-1e30, y1 =-1e30, z1 =-1e30;
    for (var i = 0; i < this.box.length; i++) {
	var p = this.box[i];
	var q = mview.transform(p);
	var z = -q[2];
	var x = q[0] / z;
	var y = q[1] / z;
	x0 = Math.min(x0, x);
	x1 = Math.max(x1, x);
	y0 = Math.min(y0, y);
	y1 = Math.max(y1, y);
	z0 = Math.min(z0, z);
	z1 = Math.max(z1, z);
    };
    var k = z0 * 1.01;

    var mproj = Matrix.frustum(k * x0, k * x1, k * y0, k * y1, z0, z1);

    var matrix = Matrix.multiply(mproj, mview);

    return matrix;
};

Application.prototype.draw_shadow = function()
{
    var gl = this.ctx;

    var matrix = this.shadow_matrix();

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    gl.viewport(0, 0, this.shadow_width, this.shadow_height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.enable(gl.DEPTH_TEST);

    gl.useProgram(this.shadow_prog);

    gl.uniformMatrix4fv(gl.getUniformLocation(this.shadow_prog, 'matrix'), false, new Float32Array(matrix.as_array()));

    var a_position = gl.getAttribLocation(this.shadow_prog, 'a_position');
    gl.bindBuffer(gl.ARRAY_BUFFER, this.verts);
    gl.vertexAttribPointer(a_position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_position);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indices);
    gl.drawElements(gl.TRIANGLES, this.num_indices, gl.UNSIGNED_SHORT, 0);

    gl.useProgram(null);

    gl.disable(gl.DEPTH_TEST);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    return matrix;
};

Application.prototype.draw = function()
{
    var gl = this.ctx;

    var mshadow = this.draw_shadow();

    var mview = Matrix.identity();
    mview.postmultiply(Matrix.translate(this.object_pos));
    mview.postmultiply(Matrix.rotx(this.object_rot[0], true));
    mview.postmultiply(Matrix.roty(this.object_rot[1], true));
    mview.postmultiply(Matrix.rotz(this.object_rot[2], true));

    var m = mview.as_array();
    var mnorm = [m[0],m[1],m[2],m[4],m[5],m[6],m[8],m[9],m[10]];

    var mproj = Matrix.perspective(this.camera_fov, this.canvas.height / this.canvas.width, 0.1, 10.0);

    //mview = Matrix.identity();
    //mnorm = [1,0,0, 0,1,0, 0,0,1];
    //mproj = this.shadow_matrix();

    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.enable(gl.DEPTH_TEST);

    gl.bindTexture(gl.TEXTURE_2D, this.depth_buf);

    gl.useProgram(this.program);

    gl.uniform1i(gl.getUniformLocation(this.program, 'depth_map'), 0);
    gl.uniform3fv(gl.getUniformLocation(this.program, 'ambient'), this.ambient);
    gl.uniform3fv(gl.getUniformLocation(this.program, 'diffuse'), this.diffuse);
    gl.uniform3fv(gl.getUniformLocation(this.program, 'specular'), this.specular);
    gl.uniform1f(gl.getUniformLocation(this.program, 'shininess'), this.shininess);
    gl.uniform3fv(gl.getUniformLocation(this.program, 'light_pos'), this.light_pos);
    gl.uniformMatrix4fv(gl.getUniformLocation(this.program, 'mview'), false, new Float32Array(mview.as_array()));
    gl.uniformMatrix4fv(gl.getUniformLocation(this.program, 'mproj'), false, new Float32Array(mproj.as_array()));
    gl.uniformMatrix3fv(gl.getUniformLocation(this.program, 'mnorm'), false, new Float32Array(mnorm));
    gl.uniformMatrix4fv(gl.getUniformLocation(this.program, 'mshadow'), false, new Float32Array(mshadow.as_array()));

    var a_position = gl.getAttribLocation(this.program, 'a_position');
    gl.bindBuffer(gl.ARRAY_BUFFER, this.verts);
    gl.vertexAttribPointer(a_position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_position);

    var a_normal = gl.getAttribLocation(this.program, 'a_normal');
    gl.bindBuffer(gl.ARRAY_BUFFER, this.norms);
    gl.vertexAttribPointer(a_normal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_normal);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indices);
    gl.drawElements(gl.TRIANGLES, this.num_indices, gl.UNSIGNED_SHORT, 0);

    gl.useProgram(null);

    gl.bindTexture(gl.TEXTURE_2D, null);

    gl.disable(gl.DEPTH_TEST);

    gl.flush();

    this.check_error();
};

// ************************************************************

Application.prototype.key_down = function(event)
{
    WebGLApp.prototype.key_down.call(this, event);
    return false;
};

Application.prototype.key_up = function(event)
{
    WebGLApp.prototype.key_up.call(this, event);
    return false;
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

