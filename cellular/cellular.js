"use strict";

// ************************************************************

function Application(canvas)
{
    WebGLApp.call(this, canvas);
}

Application.prototype = Object.create(WebGLApp.prototype);
Application.prototype.context_attributes = {depth: false, antialias: false};

Application.prototype.init = function()
{
    this.program = null;
    this.update_prog = null;

    this.fb_width = 256;
    this.fb_height = 256;

    this.src_tex = null;
    this.dst_tex = null;
    this.framebuffer = null;

    this.texco = null;
    this.indices  = null;
    this.num_indices = null;

    this.verts = [];
    this.paused = false;
    this.color = [1,1,1];
    this.line_width = 1;
};

Application.prototype.setup_programs = function()
{
    this.program     = this.create_program("vshader", "fshader");
    this.update_prog = this.create_program("vshader_update", "fshader_update");
    this.paint_prog  = this.create_program("vshader_paint", "fshader_paint");
    this.set_color(document.getElementById("color_111"),[1,1,1]);
    this.set_width(document.getElementById("width_1"),1);
};

Application.prototype.setup_framebuffer = function()
{
    var gl = this.ctx;

    var width = this.fb_width;
    var height = this.fb_height;

    var data = [];
    var n = width * height;
    for (var i = 0; i < n; i++) {
        data.push(Math.floor(Math.random() * 255.99));
        data.push(Math.floor(Math.random() * 255.99));
        data.push(Math.floor(Math.random() * 255.99));
    }
    data = new Uint8Array(data);

    this.src_tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.src_tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, width, height, 0,
		  gl.RGB, gl.UNSIGNED_BYTE, data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.bindTexture(gl.TEXTURE_2D, null);

    this.dst_tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.dst_tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, width, height, 0,
		  gl.RGB, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.bindTexture(gl.TEXTURE_2D, null);

    this.framebuffer = gl.createFramebuffer();

    this.check_error();
};

Application.prototype.setup_buffers = function(obj)
{
    var gl = this.ctx;

    var texco = [[0,0],[0,1],[1,0],[1,1]];
    var indices = [0,1,2, 2,1,3];

    this.texco    = this.array_buffer(this.flatten(texco,1));
    this.indices  = this.index_buffer(indices);
    this.num_indices = indices.length;

    this.check_error();
};

Application.prototype.setup = function()
{
    this.setup_programs();
    this.setup_framebuffer();
    this.setup_buffers();
};

Application.prototype.paint = function(verts)
{
    var gl = this.ctx;

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.src_tex, 0);

    gl.viewport(0, 0, this.fb_width, this.fb_height);

    gl.useProgram(this.paint_prog);

    var u_color = gl.getUniformLocation(this.paint_prog, 'color');
    gl.uniform3f(u_color, this.color[0], this.color[1], this.color[2]);

    if (this.line_width > 1)
        verts = this.thicken(verts, this.line_width);

    var verts_buf = this.array_buffer(this.flatten(verts,1));
    var a_position = gl.getAttribLocation(this.paint_prog, 'a_position');
    gl.bindBuffer(gl.ARRAY_BUFFER, verts_buf);
    gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.enableVertexAttribArray(a_position);

    var mode = (this.line_width > 1) ? gl.TRIANGLES : gl.LINE_STRIP;
    gl.drawArrays(mode, 0, verts.length);

    gl.flush();

    gl.disableVertexAttribArray(a_position);
    gl.deleteBuffer(verts_buf);
    gl.useProgram(null);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    this.check_error();
};

Application.prototype.thicken = function(verts, w)
{
    var gl = this.ctx;

    var pts = [];

    for (var i = 1; i < verts.length; i++) {
        var p0 = verts[i-1];
        var p1 = verts[i];
        var x0 = p0[0];
        var y0 = p0[1];
        var x1 = p1[0];
        var y1 = p1[1];
        var tx = x1 - x0;
        var ty = y1 - y0;
        var tl = Math.sqrt(tx*tx + ty*ty);
        tx *= w / tl / this.fb_width;
        ty *= w / tl / this.fb_height;
        var nx = -ty;
        var ny =  tx;

        pts.push([x0-tx-nx, y0-ty-ny]);
        pts.push([x0-tx+nx, y0-ty+ny]);
        pts.push([x1+tx-nx, y1+ty-ny]);

        pts.push([x1+tx-nx, y1+ty-ny]);
        pts.push([x0-tx+nx, y0-ty+ny]);
        pts.push([x1+tx+nx, y1+ty+ny]);
    }

    return pts;
};

Application.prototype.update = function()
{
    if (this.verts.length > 1) {
        this.paint(this.verts);
        this.verts = [this.verts[this.verts.length-1]];
    }

    if (this.paused)
        return;
    
    var gl = this.ctx;

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.dst_tex, 0);

    gl.viewport(0, 0, this.fb_width, this.fb_height);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.bindTexture(gl.TEXTURE_2D, this.src_tex);

    gl.useProgram(this.update_prog);

    var u_texture = gl.getUniformLocation(this.update_prog, 'texture');
    gl.uniform1i(u_texture, 0);

    var u_tex_size = gl.getUniformLocation(this.update_prog, 'tex_size');
    gl.uniform2f(u_tex_size, this.fb_width, this.fb_height);

    var a_texcoord = gl.getAttribLocation(this.update_prog, 'a_texcoord');
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texco);
    gl.vertexAttribPointer(a_texcoord, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.enableVertexAttribArray(a_texcoord);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indices);
    gl.drawElements(gl.TRIANGLES, this.num_indices, gl.UNSIGNED_SHORT, 0);

    gl.flush();

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    gl.disableVertexAttribArray(a_texcoord);
    gl.useProgram(null);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    this.check_error();

    var tmp = this.dst_tex;
    this.dst_tex = this.src_tex;
    this.src_tex = tmp;
};

Application.prototype.draw = function()
{
    var gl = this.ctx;

    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.bindTexture(gl.TEXTURE_2D, this.src_tex);

    gl.useProgram(this.program);

    var u_texture = gl.getUniformLocation(this.program, 'texture');
    gl.uniform1i(u_texture, 0);

    var a_texcoord = gl.getAttribLocation(this.program, 'a_texcoord');
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texco);
    gl.vertexAttribPointer(a_texcoord, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.enableVertexAttribArray(a_texcoord);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indices);
    gl.drawElements(gl.TRIANGLES, this.num_indices, gl.UNSIGNED_SHORT, 0);

    gl.flush();

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    gl.disableVertexAttribArray(a_texcoord);
    gl.useProgram(null);
    gl.bindTexture(gl.TEXTURE_2D, null);

    this.check_error();
};

Application.prototype.convert_pos = function(event)
{
    var rect = this.canvas.getBoundingClientRect();
    var w = rect.right - rect.left;
    var h = rect.bottom - rect.top;
    var x = (event.clientX - rect.left  ) / w;
    var y = (rect.bottom - event.clientY) / h;
    return [x*2-1, y*2-1];
};

Application.prototype.mouse_down = function(event)
{
    if ((event.buttons & 1) == 0)
        return;
    var p = this.convert_pos(event);
    this.verts = [p];
};

Application.prototype.mouse_move = function(event)
{
    if ((event.buttons & 1) == 0)
        return;
    var p = this.convert_pos(event);
    this.verts.push(p);
};

Application.prototype.mouse_up = function(event)
{
    if ((event.buttons & 1) == 0)
        return;
    var p = this.convert_pos(event);
    this.verts.push(p);
};

Application.prototype.key_press = function(event)
{
    WebGLApp.prototype.key_press.call(this, event);

    var key = event.key;

    if (key == " ")
	this.paused = !this.paused;
};

Application.prototype.set_color = function(element, color)
{
    this.color = color;

    var elements = document.getElementsByClassName("color");
    for (var i = 0; i < elements.length; i++) {
        var e = elements[i];
        e.style.setProperty("border-width", e == element ? "5px" : null);
    }
};

Application.prototype.set_width = function(element, width)
{
    this.line_width = width;

    var elements = document.getElementsByClassName("width");
    for (var i = 0; i < elements.length; i++) {
        var e = elements[i];
        e.style.setProperty("border-width", e == element ? "5px" : null);
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

