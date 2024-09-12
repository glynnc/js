"use strict";

// ************************************************************

function Application(canvas)
{
    WebGLApp.call(this, canvas);
}

Application.prototype = Object.create(WebGLApp.prototype);

Application.prototype.init = function()
{
    this.start_object_pos = [0, 0,-3];
    this.width_step = 0.05;
    this.width = [0.0, 1.5];

    this.program = null;

    this.v_matrix = null;

    this.a_position = null;
    this.a_normal   = null;
    this.a_texcoord = null;

    this.position_buffer = null;
    this.normal_buffer = null;
    this.texcoord_buffer = null;
    this.num_indices = null;
    this.indices_buffer = null;
};

Application.prototype.setup_buffers = function()
{
    var gl = this.ctx;

    var verts = [
	-1,-1,-1, -1,-1, 1, -1, 1, 1, -1, 1,-1,  // -X
	 1,-1,-1,  1,-1, 1,  1, 1, 1,  1, 1,-1,  // +X
	-1,-1,-1,  1,-1,-1,  1,-1, 1, -1,-1, 1,  // -Y
	-1, 1,-1,  1, 1,-1,  1, 1, 1, -1, 1, 1,  // +Y
	-1,-1,-1,  1,-1,-1,  1, 1,-1, -1, 1,-1,  // -Z
	-1,-1, 1,  1,-1, 1,  1, 1, 1, -1, 1, 1]; // +Z

    var norms = [
	-1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,
	 1, 0, 0,  1, 0, 0,  1, 0, 0,  1, 0, 0,
	 0,-1, 0,  0,-1, 0,  0,-1, 0,  0,-1, 0,
	 0, 1, 0,  0, 1, 0,  0, 1, 0,  0, 1, 0,
	 0, 0,-1,  0, 0,-1,  0, 0,-1,  0, 0,-1,
	 0, 0, 1,  0, 0, 1,  0, 0, 1,  0, 0, 1];

    var texco = [
	0,0, 1,0, 1,1, 0,1,
	0,0, 1,0, 1,1, 0,1,
	0,0, 1,0, 1,1, 0,1,
	0,0, 1,0, 1,1, 0,1,
	0,0, 1,0, 1,1, 0,1,
	0,0, 1,0, 1,1, 0,1];

    var ix = [
	 0,  1,  2,  2,  3,  0,
	 4,  5,  6,  6,  7,  4,
	 8,  9, 10, 10, 11,  8,
	12, 13, 14, 14, 15, 12,
	16, 17, 18, 18, 19, 16,
	20, 21, 22, 22, 23, 20];

    this.position_buffer = this.array_buffer(verts);
    this.normal_buffer   = this.array_buffer(norms);
    this.texcoord_buffer = this.array_buffer(texco);

    this.indices_buffer  = this.index_buffer(ix);
    this.num_indices = ix.length;

    this.check_error();
};

Application.prototype.setup = function()
{
    var gl = this.ctx;
    gl.getExtension('OES_standard_derivatives');
    this.setup_program();
    this.setup_buffers();
    this.check_error();
};

Application.prototype.setup_program = function()
{
    var gl = this.ctx;

    this.program = this.create_program('vshader', 'fshader');

    this.v_matrix     = gl.getUniformLocation(this.program, 'matrix');
    this.v_background = gl.getUniformLocation(this.program, 'background');
    this.v_diffuse    = gl.getUniformLocation(this.program, 'diffuse');
    this.v_width      = gl.getUniformLocation(this.program, 'width');

    this.a_position = gl.getAttribLocation(this.program, "a_position");
    this.a_normal   = gl.getAttribLocation(this.program, "a_normal");
    this.a_texcoord = gl.getAttribLocation(this.program, "a_texcoord");
};

Application.prototype.draw = function()
{
    var gl = this.ctx;

    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.enable(gl.DEPTH_TEST);

    gl.useProgram(this.program);

    gl.uniform4f(this.v_background, 0, 0, 0, 1);
    gl.uniform4f(this.v_diffuse, 0, 1, 0, 1);
    gl.uniform2f(this.v_width, this.width[0], this.width[1]);

    var m = Matrix.perspective(this.camera_fov, this.canvas.height / this.canvas.width, 0.1, 10.0);
    m.postmultiply(Matrix.translate(this.object_pos));
    m.postmultiply(Matrix.rotx(this.object_rot[0], true));
    m.postmultiply(Matrix.roty(this.object_rot[1], true));
    m.postmultiply(Matrix.rotz(this.object_rot[2], true));
    gl.uniformMatrix4fv(this.v_matrix, false, new Float32Array(m.as_array()));

    gl.enableVertexAttribArray(this.a_position);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.position_buffer);
    gl.vertexAttribPointer(this.a_position, 3, gl.FLOAT, false, 0, 0);

    gl.enableVertexAttribArray(this.a_normal);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.normal_buffer);
    gl.vertexAttribPointer(this.a_normal, 3, gl.FLOAT, false, 0, 0);

    gl.enableVertexAttribArray(this.a_texcoord);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texcoord_buffer);
    gl.vertexAttribPointer(this.a_texcoord, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indices_buffer);

    gl.drawElements(gl.TRIANGLES, this.num_indices, gl.UNSIGNED_SHORT, 0);

    gl.disableVertexAttribArray(this.a_texcoord);
    gl.disableVertexAttribArray(this.a_normal);
    gl.disableVertexAttribArray(this.a_position);

    gl.useProgram(null);

    gl.flush();
    
    this.check_error();
};

Application.prototype.change_width = function(dir, shift)
{
    this.width[shift ? 0 : 1] += dir * this.width_step;

    var elem = document.getElementById("width");
    elem.textContent = this.width[0].toFixed(2) + ".." + this.width[1].toFixed(2);
};

Application.prototype.key_press = function(event)
{
    WebGLApp.prototype.key_press.call(this, event);

    var key = event.key;

    if (key == "[" || key == "{") {
	this.change_width(-1, key == "{");
    }
    else if (key == "]" || key == "}") {
	this.change_width(1, key == "}");
    }
};

// ************************************************************

var app = null;

function init()
{
    var canvas = document.getElementById("canvas");
    app = new Application(canvas);
    app.change_width(0);
    setInterval(app.refresh.bind(app), 15);
}

// ************************************************************

