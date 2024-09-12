"use strict";

// ************************************************************

function Application(canvas)
{
    WebGLApp.call(this, canvas);
}

Application.prototype = Object.create(WebGLApp.prototype);

Application.prototype.init = function()
{
    this.tex_w = canvas.width;
    this.tex_h = canvas.height;

    var m0 = Matrix.scale(0.5, 0.5, 1);
    var m1 = m0.postmultiplied(Matrix.translate(-0.5,-0.5, 0));
    var m2 = m0.postmultiplied(Matrix.translate( 0.5,-0.5, 0));
    var m3 = m0.postmultiplied(Matrix.translate(-0.5, 0.5, 0));
    this.transforms = [m1, m2, m3];
    this.saves = [[m1.clone(), m2.clone(), m3.clone()]];
    this.save = 0;
    this.identity = Matrix.identity();
    this.colors = [[1,1,1], [1,0,0], [0,0,1], [1,0,1]];
    this.corners = [[0,0], [1,0], [0,1], [1,1]];
    this.thick = 1;
    this.hide_edit = false;
    this.ready = false;

    this.framebuffer = null;
    this.textures = null;
    this.position_buffer = null;
    this.texcoord_buffer = null;
    this.box_buffer = null;
    this.cross_buffer = null;

    this.program = null;
    this.v_matrix = null;
    this.v_texture = null;
    this.a_position = null;
    this.a_texcoord = null;

    this.edit_program = null;
    this.ev_matrix = null;
    this.ev_color = null;
    this.ae_position = null;

    this.drag_xform  = null;
    this.drag_corner = null;
    this.drag_x = null;
    this.drag_y = null;
    this.drag_start = null;
    this.drag_modifier = null;
}

Application.prototype.setup_buffers = function()
{
    var gl = this.ctx;

    this.position_buffer = this.array_buffer([-1,-1, 1,-1, -1,1,  1,1]);
    this.texcoord_buffer = this.array_buffer([ 0, 0, 1, 0,  0,1,  1,1]);
    this.box_buffer      = this.array_buffer([-1,-1, 1,-1,  1,1, -1,1]);
    this.cross_buffer    = this.array_buffer([ 0,-1, 0, 1, -1,0,  1,0]);

    this.check_error();
};

Application.prototype.setup_framebuffer = function()
{
    var gl = this.ctx;

    this.textures = [];
    for (var i = 0; i < 2; i++) {
	var texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.tex_w, this.tex_h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	this.textures.push(texture);
    }

    this.framebuffer = gl.createFramebuffer();
};

Application.prototype.setup = function()
{
    this.setup_programs();
    this.setup_buffers();
    this.setup_framebuffer();
    this.check_error();
};

Application.prototype.setup_programs = function()
{
    var gl = this.ctx;

    this.program = this.create_program('vshader', 'fshader');

    this.v_matrix = gl.getUniformLocation(this.program, 'matrix');
    this.v_texture = gl.getUniformLocation(this.program, 'texture');

    this.a_position = gl.getAttribLocation(this.program, "a_position");
    this.a_texcoord = gl.getAttribLocation(this.program, "a_texcoord");

    this.edit_program = this.create_program('edit_vshader', 'edit_fshader');

    this.ev_matrix = gl.getUniformLocation(this.edit_program, 'matrix');
    this.ev_color = gl.getUniformLocation(this.edit_program, 'color');

    this.ea_position = gl.getAttribLocation(this.edit_program, "a_position");
};

Application.prototype.draw_box = function()
{
    var gl = this.ctx;

    gl.bindBuffer(gl.ARRAY_BUFFER, this.box_buffer);
    gl.vertexAttribPointer(this.ea_position, 2, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.LINE_LOOP, 0, 4);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.cross_buffer);
    gl.vertexAttribPointer(this.ea_position, 2, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.LINES, 0, 4);
};

Application.prototype.draw = function()
{
    var gl = this.ctx;

    if (!this.ready) {
	gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);

	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.textures[0], 0);
	gl.clearColor(0, 1, 0, 1);
	gl.clear(gl.COLOR_BUFFER_BIT);
	
	this.ready = true;
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);

    gl.useProgram(this.program);

    gl.enableVertexAttribArray(this.a_position);
    gl.enableVertexAttribArray(this.a_texcoord);

    gl.uniform1i(this.v_texture, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.position_buffer);
    gl.vertexAttribPointer(this.a_position, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.texcoord_buffer);
    gl.vertexAttribPointer(this.a_texcoord, 2, gl.FLOAT, true, 0, 0);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // draw transformed copies of previous frame
    var src = this.textures[0];
    var dst = this.textures[1];

    gl.bindTexture(gl.TEXTURE_2D, src);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, dst, 0);

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    for (var i = 0; i < this.transforms.length; i++) {
	var m = this.identity.postmultiplied(this.transforms[i]);
	gl.uniformMatrix4fv(this.v_matrix, false, new Float32Array(m.as_array()));

	gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    // thicken result
    var src = this.textures[1];
    var dst = this.textures[0];

    gl.bindTexture(gl.TEXTURE_2D, src);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, dst, 0);

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    for (var x = 0; x <= this.thick; x++) {
	for (var y = 0; y <= this.thick; y++) {
	    var m = Matrix.translate(2*x/this.tex_w, 2*y/this.tex_h, 0);

	    gl.uniformMatrix4fv(this.v_matrix, false, new Float32Array(m.as_array()));

	    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
	}
    }

    // draw to screen
    var src = this.textures[0];

    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, null, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, src);

    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.uniformMatrix4fv(this.v_matrix, false, new Float32Array(this.identity.as_array()));

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    gl.disableVertexAttribArray(this.a_texcoord);
    gl.disableVertexAttribArray(this.a_position);

    if (!this.hide_edit) {
	// draw transformations
	gl.useProgram(this.edit_program);

	gl.enableVertexAttribArray(this.ea_position);

	var m = Matrix.scale(0.5, 0.5, 1);
	gl.uniformMatrix4fv(this.ev_matrix, false, new Float32Array(m.as_array()));
	gl.uniform3f(this.ev_color, 1, 1, 0);
	this.draw_box();

	for (var i = 0; i < this.transforms.length; i++) {
	    var m = this.transforms[i].postmultiplied(Matrix.scale(0.5, 0.5, 1));
	    gl.uniformMatrix4fv(this.ev_matrix, false, new Float32Array(m.as_array()));
	    gl.uniform3f(this.ev_color, 1, 1, 1);

	    this.draw_box();

	    gl.bindBuffer(gl.ARRAY_BUFFER, this.position_buffer);
	    gl.vertexAttribPointer(this.ea_position, 2, gl.FLOAT, false, 0, 0);
	
	    for (var j = 0; j < this.corners.length; j++) {
		var c = this.colors[j];
		var k = this.corners[j];
		var v = [-k[0], -k[1]];
		var p = m.transform(k);
		var mm = new Matrix();
		mm.postmultiply(Matrix.translate(p));
		mm.postmultiply(Matrix.scale(0.01,0.01,1));
		mm.postmultiply(Matrix.translate(v[0], v[1], 0));
		gl.uniform3f(this.ev_color, c[0], c[1], c[2]);
		gl.uniformMatrix4fv(this.ev_matrix, false, new Float32Array(mm.as_array()));
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
	    }
	}

	gl.disableVertexAttribArray(this.ea_position);
    }

    // done
    gl.useProgram(null);

    gl.disable(gl.BLEND);

    gl.flush();
    
    this.check_error();
};

Application.prototype.change_save = function(dir)
{
    this.save += dir;
    this.save += this.saves.length;
    this.save %= this.saves.length;
    this.load();
};

Application.prototype.load = function()
{
    var save = this.saves[this.save];
    this.transforms = [];
    for (var i = 0; i < save.length; i++)
	this.transforms.push(save[i].clone());
};

Application.prototype.key_press = function(event)
{
    var key = event.key.toLowerCase();

    if (key == "r") {
	this.ready = false;
    }
    if (key == "t") {
	this.thick = this.thick ? 0 : 1;
    }
    if (key == "h") {
	this.hide_edit = !this.hide_edit;
    }
    if (key == "s") {
	var save = [];
	for (var i = 0; i < this.transforms.length; i++)
	    save.push(this.transforms[i].clone());
	this.saves.push(save);
    }
    if (key == "[") {
	this.change_save(-1);
    }
    if (key == "]") {
	this.change_save(1);
    }
};

Application.prototype.find_handle = function(x, y)
{

    for (var i = 0; i < this.transforms.length; i++) {
	var m = this.transforms[i].postmultiplied(Matrix.scale(0.5, 0.5, 1));
	for (var j = 0; j < this.corners.length; j++) {
	    var k = this.corners[j];
	    var v = [-k[0], -k[1]];
	    var p = m.transform(k);
	    var mm = new Matrix();
	    mm.postmultiply(Matrix.translate(p));
	    mm.postmultiply(Matrix.scale(0.01,0.01,1));
	    mm.postmultiply(Matrix.translate(v[0], v[1], 0));
	    var p0 = mm.transform([-1,-1]);
	    var p1 = mm.transform([ 1, 1]);
	    if (x >= p0[0] && x < p1[0] && y >= p0[1] && y < p1[1])
		return [i, j];
	}
    }

    return null;
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
    var p = this.convert_pos(event);
    var x = p[0];
    var y = p[1];
    var handle = this.find_handle(x, y);

    if (handle == null)
	return;

    this.drag_xform  = handle[0];
    this.drag_corner = handle[1];
    this.drag_start = new Matrix(this.transforms[this.drag_xform]);
    this.drag_x = x;
    this.drag_y = y;
    this.drag_modifier = (
	event.shiftKey ? "shift" :
	event.ctrlKey ? "ctrl" :
	event.altKey ? "alt" : "none");
};

Application.prototype.mouse_move = function(event)
{
    if (this.drag_xform == null)
	return;

    var p = this.convert_pos(event);
    var x = p[0];
    var y = p[1];

    var o = this.drag_start.transform([0, 0]);
    var ox = o[0];
    var oy = o[1];

    switch (this.drag_corner) {
    case 0:
	if (this.drag_modifier == "none") {
	    var dx = x - this.drag_x;
	    var dy = y - this.drag_y;
	    this.transforms[this.drag_xform] = this.drag_start.premultiplied(Matrix.translate(dx, dy, 0));
	}
	break;
    case 1:
	if (this.drag_modifier == "none") {
	    var l0 = Math.hypot(this.drag_x - ox, this.drag_y - oy);
	    var l1 = Math.hypot(x - ox, y - oy);
	    var s = l1 / l0;
	    this.transforms[this.drag_xform] = this.drag_start.postmultiplied(Matrix.scale(s, 1, 1));
	}
	else if (this.drag_modifier == "shift") {
	    var a0 = Math.atan2(this.drag_y - oy, this.drag_x - ox);
	    var a1 = Math.atan2(y - oy, x - ox);
	    var a = a1 - a0;
	    this.transforms[this.drag_xform] = this.drag_start.postmultiplied(Matrix.shearz(a, 0));
	}
	break;
    case 2:
	if (this.drag_modifier == "none") {
	    var l0 = Math.hypot(this.drag_x - ox, this.drag_y - oy);
	    var l1 = Math.hypot(x - ox, y - oy);
	    var s = l1 / l0;
	    this.transforms[this.drag_xform] = this.drag_start.postmultiplied(Matrix.scale(1, s, 1));
	}
	else if (this.drag_modifier == "shift") {
	    var a0 = Math.atan2(this.drag_y - oy, this.drag_x - ox);
	    var a1 = Math.atan2(y - oy, x - ox);
	    var a = a1 - a0;
	    this.transforms[this.drag_xform] = this.drag_start.postmultiplied(Matrix.shearz(0, a));
	}
	break;
    case 3:
	if (this.drag_modifier == "none") {
	    var l0 = Math.hypot(this.drag_x - ox, this.drag_y - oy);
	    var l1 = Math.hypot(x - ox, y - oy);
	    var s = l1 / l0;
	    this.transforms[this.drag_xform] = this.drag_start.postmultiplied(Matrix.scale(s, s, 1));
	}
	else if (this.drag_modifier == "shift") {
	    var a0 = Math.atan2(this.drag_y - oy, this.drag_x - ox);
	    var a1 = Math.atan2(y - oy, x - ox);
	    var a = a1 - a0;
	    this.transforms[this.drag_xform] = this.drag_start.postmultiplied(Matrix.rotz(a));
	}
	break;
    }
};

Application.prototype.mouse_up = function(event)
{
    this.drag_xform  = null;
    this.drag_corner = null;
    this.drag_x = null;
    this.drag_y = null;
    this.drag_start = null;
    this.drag_modifier = null;
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

