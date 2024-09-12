"use strict";

// ************************************************************

function Application(canvas)
{
    WebGLApp.call(this, canvas);
}

Application.prototype = Object.create(WebGLApp.prototype);

Application.prototype.context_attributes = {preserveDrawingBuffer: true};

Application.prototype.init = function()
{
    this.size = 16;
    this.delta = 0.2;
    this.hex = false;

    this.program = null;
    this.tex_points = null;
    this.position_buffer = null;
    this.texcoord_buffer = null;
    this.num_indices = null;
    this.indices_buffer = null;
};

Application.prototype.setup_program = function()
{
    var gl = this.ctx;
    this.program = this.create_program('vshader', 'fshader');
    this.check_error();
};

Application.prototype.points_texture = function()
{
    var gl = this.ctx;

    gl.bindTexture(gl.TEXTURE_2D, this.tex_points);

    var w = this.size;
    var h = this.size;
    var data = new Uint8Array(w * h * 4);

    var i = 0;
    for (var y = 0; y < h; y++) {
        for (var x = 0; x < w; x++) {
            var u = Math.random() * 2 - 1;
            var v = Math.random() * 2 - 1;
            var d = Math.hypot(u, v);
            data[i++] = Math.floor(128+127.99*u/d);
            data[i++] = Math.floor(128+127.99*v/d);
            data[i++] = 0;
            data[i++] = 0;
        }
    }

    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, data);

    this.check_error();
};

Application.prototype.setup_textures = function()
{
    var gl = this.ctx;

    var tex_points = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex_points);

    var w = this.size;
    var h = this.size;
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

    this.check_error();

    this.tex_points = tex_points;

    this.points_texture();
};

Application.prototype.setup_buffers = function()
{
    this.position_buffer = this.array_buffer([-1,-1, 1,-1, 1,1, -1,1]);
    this.texcoord_buffer = this.array_buffer([0,0, 1,0, 1,1, 0,1]);

    var indices = [0,1,2, 2,3,0];
    this.indices_buffer  = this.index_buffer(indices);
    this.num_indices = indices.length;

    this.check_error();
};

Application.prototype.setup = function()
{
    this.setup_buffers();
    this.setup_program();
    this.setup_textures();
    this.update_params();
};

Application.prototype.draw = function()
{
    var gl = this.ctx;
    var program = this.program;

    gl.useProgram(program);

    gl.bindTexture(gl.TEXTURE_2D, this.tex_points);
    gl.uniform1i(gl.getUniformLocation(program, 'texture'), 0);

    gl.uniform1f(gl.getUniformLocation(program, 'delta'), this.delta);
    gl.uniform1f(gl.getUniformLocation(program, 'shear'), this.hex ? 0.5 : 0.0);
    gl.uniform1i(gl.getUniformLocation(program, 'size'), this.size);

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

Application.prototype.update_params = function()
{
    document.getElementById("delta").value = this.delta.toFixed(3);
    document.getElementById("square").checked = !this.hex;
    document.getElementById("hexagon").checked = this.hex;
};

Application.prototype.redraw = function()
{
    window.requestAnimationFrame(this.draw.bind(this));
};

Application.prototype.change_delta = function()
{
    var element = document.getElementById("delta");
    this.delta = Number(element.value);
    this.redraw();
};

Application.prototype.change_grid = function()
{
    var element = document.getElementById("hexagon");
    this.hex = element.checked;
    this.redraw();
};

Application.prototype.randomize = function()
{
    this.points_texture();
    this.redraw();
};

// ************************************************************

var app = null;

function init()
{
    canvas = document.getElementById("canvas");
    app = new Application(canvas);
    app.redraw.call(app);
}

