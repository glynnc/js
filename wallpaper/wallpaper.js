"use strict";

// ************************************************************

function Application(canvas)
{
    WebGLApp.call(this, canvas);
}

Application.prototype = Object.create(WebGLApp.prototype);

Application.prototype.init = function()
{
    this.groups = ["p1", "p2", "pm", "pg", "cm", "pmm", "pmg", "pgg", "cmm",
		   "p4", "p4m", "p4g", "p3", "p3m1", "p31m", "p6", "p6m"];

    this.zoom = -12;
    this.group = 0;
    this.tex_x = 0;
    this.tex_y = 0;
    this.tex_rot = 0;
    this.tex_dx = 1;
    this.tex_dy = 1;
    this.tex_move_speed = 0.1;
    this.tex_rot_speed = 30.0;
    this.animate = true;

    this.programs = {};
    this.texture = null;
    this.position_buffer = null;
    this.texcoord_buffer = null;
    this.num_indices = null;
    this.indices_buffer = null;

    this.time = Date.now() / 1e3;
};

Application.prototype.setup_programs = function()
{
    var gl = this.ctx;

    var vertex_name = 'vshader';
    var vertex_src = this.load_source(vertex_name);
    var vertex_shader = this.shader(vertex_name, gl.VERTEX_SHADER, vertex_src);

    for (var g = 0; g < this.groups.length; g++) {
	var group = this.groups[g];
	var fragment_name = 'fshader_' + group;
	var fragment_src = this.load_source(fragment_name);
	var fragment_shader = this.shader(fragment_name, gl.FRAGMENT_SHADER, fragment_src);
	var program = this.make_program(vertex_shader, fragment_shader);
	this.check_error();
	this.programs[group] = program;
    }
};

Application.prototype.setup_texture = function()
{
    this.texture = this.load_texture("image");
};

Application.prototype.setup_buffers = function()
{
    this.position_buffer = this.array_buffer([-1,-1, 1,-1, 1,1, -1,1]);
    this.texcoord_buffer = this.array_buffer([-1,1, 1,1, 1,-1, -1,-1]);

    var indices = [0,1,2, 2,3,0];
    this.indices_buffer  = this.index_buffer(indices);
    this.num_indices = indices.length;

    this.check_error();
};

Application.prototype.setup = function()
{
    this.update_group();
    this.update_animate();
    this.setup_buffers();
    this.setup_texture();
    this.setup_programs();
};

Application.prototype.draw = function()
{
    var gl = this.ctx;

    var a = canvas.height / canvas.width;
    var sx = Math.pow(1.1, -this.zoom);
    var sy = sx * a;
    var matrix = [sx,  0, 0,
		   0,-sy, 0,
		   0,  0, 0];
    var program = this.programs[this.groups[this.group]];

    var r = this.tex_rot * Math.PI / 180;
    var ts = Math.sin(r);
    var tc = Math.cos(r);
    var tex_mat = [tc,        -ts,         0,
		   ts,         tc,         0,
		   this.tex_x, this.tex_y, 1];

    gl.useProgram(program);
    gl.uniformMatrix3fv(gl.getUniformLocation(program, 'matrix'), false, new Float32Array(matrix));
    gl.uniformMatrix3fv(gl.getUniformLocation(program, 'tex_mat'), false, new Float32Array(tex_mat));
    gl.uniform1i(gl.getUniformLocation(program, 'texture'), 0);

    gl.bindTexture(gl.TEXTURE_2D, this.texture);

    var position_attrib = gl.getAttribLocation(program, "a_Position");
    gl.enableVertexAttribArray(position_attrib);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.position_buffer);
    gl.vertexAttribPointer(position_attrib, 2, gl.FLOAT, false, 0, 0);

    var texcoord_attrib = gl.getAttribLocation(program, "a_TexCoord");
    gl.enableVertexAttribArray(texcoord_attrib);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texcoord_buffer);
    gl.vertexAttribPointer(texcoord_attrib, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indices_buffer);

    gl.drawElements(gl.TRIANGLES, this.num_indices, gl.UNSIGNED_SHORT, 0);

    gl.useProgram(null);

    gl.flush();

    this.check_error();
};

// ************************************************************

Application.prototype.update_group = function()
{
    for (var i = 0; i < this.groups.length; i++) {
	var element = document.getElementById("group_" + this.groups[i]);
	element.style.setProperty("background", (i == this.group) ? "#00ffff" : "#ffffff");
    }
};

Application.prototype.change_group = function(dir)
{
    this.group += dir;
    this.group += this.groups.length;
    this.group %= this.groups.length;
    this.update_group();
};

Application.prototype.set_group = function(id)
{
    for (var i = 0; i < this.groups.length; i++) {
	if (id != this.groups[i])
	    continue;
	this.group = i;
	break;
    }

    this.update_group();
};

Application.prototype.change_zoom = function(dir)
{
    this.zoom += dir;
};

Application.prototype.update_animate = function()
{
    var element = document.getElementById("animate");
    element.style.setProperty("background", this.animate ? "#00ffff" : "#ffffff");
};

Application.prototype.toggle_animate = function()
{
    this.animate = !this.animate;
    this.update_animate();
};

Application.prototype.change_image = function()
{
    var element = document.getElementById("image_url");
    var url = element.value;
    element = document.getElementById("image");
    element.src = url;
    this.setup_texture();
};

Application.prototype.reset = function()
{
    this.tex_x = 0;
    this.tex_y = 0;
    this.tex_rot = 0;
};

Application.prototype.key_press = function(event)
{
    if (event.key == "ArrowUp" || event.key == "Up") {
	this.change_zoom(1);
    }
    if (event.key == "ArrowDown" || event.key == "Down") {
	this.change_zoom(-1);
    }
    if (event.key == "ArrowLeft" || event.key == "Left") {
	this.change_group(-1);
    }
    if (event.key == "ArrowRight" || event.key == "Right") {
	this.change_group(1);
    }
};

Application.prototype.move = function(x, y)
{
    this.tex_x += x;
    this.tex_y += y;
};

Application.prototype.update = function()
{
    var now = Date.now() / 1e3;
    var diff = now - this.time;
    this.time = now;

    if (!this.animate)
        return;
    
    this.tex_x += this.tex_dx * this.tex_move_speed * diff;
    this.tex_y += this.tex_dy * this.tex_move_speed * diff;
    this.tex_rot += this.tex_rot_speed * diff;
};

// ************************************************************

var app = null;

function init()
{
    canvas = document.getElementById("canvas");
    app = new Application(canvas);
    setInterval(app.refresh.bind(app), 15);
}

