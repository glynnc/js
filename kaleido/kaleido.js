"use strict";

// ************************************************************

function Application(canvas)
{
    WebGLApp.call(this, canvas);
}

Application.prototype = Object.create(WebGLApp.prototype);

Application.prototype.init = function()
{
    this.count = 6;
    this.mirror = true;
    this.tex_x = 0;
    this.tex_y = 0;
    this.tex_rot = 0;
    this.tex_dx = 1;
    this.tex_dy = 1;
    this.tex_move_speed = 0.1;
    this.tex_rot_speed = 30.0;
    this.animate = true;

    this.program = null;
    this.texture = null;
    this.position_buffer = null;
    this.texcoord_buffer = null;
    this.num_indices = null;
    this.indices_buffer = null;

    this.time = Date.now() / 1e3;
};

Application.prototype.setup_program = function()
{
    var gl = this.ctx;
    this.program = this.create_program('vshader', 'fshader');
    this.check_error();
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
    this.update_ui();
    this.setup_buffers();
    this.setup_texture();
    this.setup_program();
};

Application.prototype.draw = function()
{
    var gl = this.ctx;

    var program = this.program;

    var r = this.tex_rot * Math.PI / 180;
    var ts = Math.sin(r);
    var tc = Math.cos(r);
    var tex_mat = [tc,        -ts,         0,
		   ts,         tc,         0,
		   this.tex_x, this.tex_y, 1];

    gl.useProgram(program);
    gl.uniformMatrix3fv(gl.getUniformLocation(program, 'matrix'), false, new Float32Array([1,0,0,0,1,0,0,0,1]));
    gl.uniformMatrix3fv(gl.getUniformLocation(program, 'tex_mat'), false, new Float32Array(tex_mat));
    gl.uniform1i(gl.getUniformLocation(program, 'texture'), 0);
    gl.uniform1i(gl.getUniformLocation(program, 'mirror'), this.mirror ? 1 : 0);
    gl.uniform1i(gl.getUniformLocation(program, 'count'), this.count);

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

Application.prototype.change_count = function(dir)
{
    this.count += dir;
    if (this.count < 2)
        this.count = 2;
    this.update_count();
};

Application.prototype.set_count = function(value)
{
    this.count = Math.floor(Number(value));
};

Application.prototype.update_count = function()
{
    document.getElementById("count").value = this.count.toFixed();
};

Application.prototype.update_ui = function()
{
    document.getElementById("count").value = this.count.toFixed();
    document.getElementById("mirror").checked = this.mirror;
    document.getElementById("animate").checked = this.animate;
};

Application.prototype.set_mirror = function(value)
{
    this.mirror = value;
};

Application.prototype.set_animate = function(value)
{
    this.animate = value;
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

