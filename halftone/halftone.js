"use strict";

// ************************************************************

function Application(canvas)
{
    WebGLApp.call(this, canvas);
}

Application.prototype = Object.create(WebGLApp.prototype);

Application.prototype.init = function()
{
    this.current_halftone = 0;
    this.hardness = 10;
    this.use_texco = false;
    this.diffuse = [1, 1, 1, 1];
    this.clear_color = [0, 0, 0, 1];
    this.halftones = null;

    this.start_object_rot = [0, 0, 0];
    this.start_object_pos = [0, 0,-2];
    this.start_light_pos  = [1, 1,-1];

    this.obj = null;
    this.program = null;

    this.v_matrix_m = null;
    this.v_matrix_p = null;
    this.v_matrix_n = null;
    this.v_hardness = null;
    this.v_light_pos = null;
    this.v_diffuse = null;
    this.v_halftone = null;
    this.v_size = null;
    this.v_background = null;
    this.v_texco = null;
};

Application.prototype.setup_buffers = function()
{
    var gl = this.ctx;

    this.position_buffer = this.array_buffer(monkey_verts);
    this.texcoord_buffer = this.array_buffer(monkey_texco);
    this.normal_buffer   = this.array_buffer(monkey_norms);

    this.indices_buffer  = this.index_buffer(monkey_faces);
    this.num_indices = monkey_faces.length;

    this.check_error();
};

Application.prototype.setup_textures = function()
{
    var r = 128;
    this.halftones = [
	[this.load_texture('h_lines'),		[8, 8]],
	[this.load_texture('h_diamonds'),	[8, 8]],
	[this.load_texture('h_circles'),	[8, 8]],
	[this.load_texture('h_random'),		[r, r]],
	[this.load_texture('h_ordered'),	[8, 8]],
	[this.load_texture('h_spots'),		[r/2, r/2]],
	[this.load_texture('h_dashes'),		[32, r]]
	];
};

Application.prototype.setup = function()
{
    this.setup_program();
    this.setup_buffers();
    this.setup_textures();
    this.check_error();
};

Application.prototype.setup_program = function()
{
    var gl = this.ctx;

    this.program = this.create_program('vshader', 'fshader');

    this.v_matrix_m   = gl.getUniformLocation(this.program, 'modelview_matrix');
    this.v_matrix_p   = gl.getUniformLocation(this.program, 'projection_matrix');
    this.v_matrix_n   = gl.getUniformLocation(this.program, 'normal_matrix');
    this.v_light_pos  = gl.getUniformLocation(this.program, 'light_pos');
    this.v_diffuse    = gl.getUniformLocation(this.program, 'diffuse');
    this.v_halftone   = gl.getUniformLocation(this.program, 'halftone');;
    this.v_size       = gl.getUniformLocation(this.program, 'size');
    this.v_background = gl.getUniformLocation(this.program, 'background')
    this.v_hardness   = gl.getUniformLocation(this.program, 'hardness');
    this.v_texco      = gl.getUniformLocation(this.program, 'texco');

    this.position_attrib = gl.getAttribLocation(this.program, "a_position");
    this.normal_attrib   = gl.getAttribLocation(this.program, "a_normal");
    this.texcoord_attrib = gl.getAttribLocation(this.program, "a_texcoord");
};

Application.prototype.draw = function()
{
    var gl = this.ctx;

    var halftone = this.halftones[this.current_halftone];
    var tex = halftone[0];
    var size = halftone[1];

    gl.clearColor.apply(gl, this.clear_color);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.enable(gl.DEPTH_TEST);
    gl.useProgram(this.program);

    gl.bindTexture(gl.TEXTURE_2D, tex);

    gl.uniform1i(this.v_halftone, 0);
    gl.uniform2f(this.v_size, size[0], size[1]);
    gl.uniform1f(this.v_hardness, Math.pow(1.2, -this.hardness));
    gl.uniform1i(this.v_texco, this.use_texco ? 1 : 0);
    gl.uniform4fv(this.v_background, new Float32Array(this.clear_color));
    gl.uniform4fv(this.v_diffuse, new Float32Array(this.diffuse));
    gl.uniform3fv(this.v_light_pos, new Float32Array(this.light_pos));

    var p = Matrix.perspective(90, this.canvas.height / this.canvas.width, 0.1, 50.0);
    gl.uniformMatrix4fv(this.v_matrix_p, false, new Float32Array(p.as_array()));

    var m = new Matrix();
    m.postmultiply(Matrix.translate(this.object_pos));
    m.postmultiply(Matrix.rotx(this.object_rot[0], true));
    m.postmultiply(Matrix.roty(this.object_rot[1], true));
    m.postmultiply(Matrix.rotz(this.object_rot[2], true));
    var c = m.as_array();
    var n = [c[0], c[1], c[2],
	     c[4], c[5], c[6],
	     c[8], c[9], c[10]];
    gl.uniformMatrix4fv(this.v_matrix_m, false, new Float32Array(c));
    gl.uniformMatrix3fv(this.v_matrix_n, false, new Float32Array(n));

    gl.enableVertexAttribArray(this.position_attrib);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.position_buffer);
    gl.vertexAttribPointer(this.position_attrib, 3, gl.FLOAT, false, 0, 0);

    gl.enableVertexAttribArray(this.texcoord_attrib);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texcoord_buffer);
    gl.vertexAttribPointer(this.texcoord_attrib, 2, gl.FLOAT, true, 0, 0);

    gl.enableVertexAttribArray(this.normal_attrib);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.normal_buffer);
    gl.vertexAttribPointer(this.normal_attrib, 3, gl.FLOAT, true, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indices_buffer);

    gl.drawElements(gl.TRIANGLES, this.num_indices, gl.UNSIGNED_SHORT, 0);

    gl.useProgram(null);

    gl.flush();
    
    this.check_error();
};

Application.prototype.change_halftone = function(dir)
{
    this.current_halftone += dir;
    this.current_halftone += this.halftones.length;
    this.current_halftone %= this.halftones.length;
};

Application.prototype.change_hardness = function(dir)
{
    this.hardness += dir;
    if (this.hardness < 0)
	this.hardness = 0;
};

Application.prototype.toggle_texture = function()
{
    this.use_texco = !this.use_texco;
};

Application.prototype.key_press = function(event)
{
    WebGLApp.prototype.key_press.call(this, event);

    var key = event.key;

    if (key == "[") {
	this.change_halftone(-1);
    }
    else if (key == ']') {
	this.change_halftone(1);
    }
    else if (key == "-" || key == "_") {
	this.change_hardness(-1);
    }
    else if (key == "+" || key == "=") {
	this.change_hardness(1);
    }
    else if (key.toLowerCase() == "t") {
	this.toggle_texture();
    }
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

