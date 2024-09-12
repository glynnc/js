"use strict";

// ************************************************************

function Application(canvas)
{
    WebGLApp.call(this, canvas);
}

Application.prototype = Object.create(WebGLApp.prototype);

Application.prototype.init = function()
{
    this.steps = 360;
    this.size = 0.9;

    this.program = null;
    this.v_r0 = null;
    this.v_r1 = null;
    this.v_ratio = null;
    this.v_color = null;
    this.v_origin = null;
    this.a_angle = null;

    this.angle_buffer = null;
    this.angle_count = null;

    this.i_int = document.getElementById("ratio_integer");
    this.i_num = document.getElementById("ratio_numerator");
    this.i_den = document.getElementById("ratio_denominator");
    this.i_rad = document.getElementById("radius");
    this.i_inside = document.getElementById("inside");

    this.r_int = 4;
    this.r_num = 0;
    this.r_den = 1;
    this.r_rad = 1;
    this.inside = false;

    this.r0 = null;
    this.r1 = null;
    this.ratio = null;

    this.update_page();
    this.update_ratio();
};

Application.prototype.setup = function()
{
    this.setup_program();
    this.check_error();
    this.update_page();
};

Application.prototype.setup_program = function()
{
    var gl = this.ctx;

    this.program = this.create_program('vshader', 'fshader');

    this.v_r0 = gl.getUniformLocation(this.program, 'r0');
    this.v_r1 = gl.getUniformLocation(this.program, 'r1');
    this.v_ratio = gl.getUniformLocation(this.program, 'ratio');
    this.v_color = gl.getUniformLocation(this.program, 'color');
    this.v_origin = gl.getUniformLocation(this.program, 'origin');

    this.a_angle = gl.getAttribLocation(this.program, "a_angle");
};

Application.prototype.trace = function(x, y, r0, r1, ratio, n, color)
{
    var gl = this.ctx;

    gl.uniform2f(this.v_origin, x, y);
    gl.uniform1f(this.v_r0, r0);
    gl.uniform1f(this.v_r1, r1);
    gl.uniform1f(this.v_ratio, ratio);
    gl.uniform3f(this.v_color, color[0], color[1], color[2]);

    gl.drawArrays(gl.LINE_LOOP, 0, n);
};

Application.prototype.circle = function(x, y, r, color)
{
    this.trace(x, y, r, 0, 0, this.steps, color);
};

Application.prototype.draw = function()
{
    var gl = this.ctx;

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.disable(gl.DEPTH_TEST);
    gl.useProgram(this.program);

    gl.enableVertexAttribArray(this.a_angle);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.angle_buffer);
    gl.vertexAttribPointer(this.a_angle, 1, gl.FLOAT, false, 0, 0);

    var sign = this.inside ? -1 : 1;

    this.trace(0, 0, this.r0, this.r1, this.ratio * sign, this.angle_count, [1,1,1]);

    var a0 = Date.now() / 2e3;
    var x0 = this.r0 * Math.sin(a0);
    var y0 = this.r0 * Math.cos(a0);

    var a1 = a0 * this.ratio * sign;
    var x1 = x0 + this.r1 * Math.sin(a1);
    var y1 = y0 + this.r1 * Math.cos(a1);

    this.circle(0, 0, this.rl, [0,1,0]);
    this.circle(0, 0, this.r0, [1,0,0]);
    this.circle(x0, y0, 0.01, [1,1,0]);
    this.circle(x0, y0, this.r1, [0,0,1]);
    this.circle(x0, y0, this.rs, [0,1,0]);
    this.circle(x1, y1, 0.01, [1,1,0]);

    gl.flush();
    
    this.check_error();
};

Application.prototype.update_buffer = function()
{
    var gl = this.ctx;

    this.angle_count = this.r_den * this.steps;
    var angles = [];
    for (var i = 0; i < this.angle_count; i++) {
	var a = i * 2 * Math.PI / this.steps;
	angles.push(a);
    }
    if (this.angle_buffer != null)
	gl.deleteBuffer(this.angle_buffer);
    this.angles = angles;
    this.angle_buffer = this.array_buffer(angles);
};

Application.prototype.update_page = function()
{
    this.i_int.value = "" + this.r_int;
    this.i_num.value = "" + this.r_num;
    this.i_den.value = "" + this.r_den;
    this.i_rad.value = "" + this.r_rad;
};

Application.prototype.update_ratio = function()
{
    this.r_int = Number(this.i_int.value);
    this.r_num = Number(this.i_num.value);
    this.r_den = Number(this.i_den.value);
    this.r_rad = Number(this.i_rad.value);
    this.inside = this.i_inside.checked;

    this.r_int = Math.max(this.r_int, this.inside ? 0 : 1);
    this.r_den = Math.max(this.r_den, 1);
    this.r_num = Math.max(this.r_num, 0);
    this.r_num = Math.min(this.r_num, this.r_den - 1);
    this.r_rad = Math.max(this.r_rad, 0);

    this.update_page();

    this.ratio = this.r_int + this.r_num / this.r_den;


    // inside (hypotrochoid)
    // (rl-rs)/rs = ratio
    // r1 = rs * radius
    // r0 + r1 = size
    // r0 = rl - rs

    // outside (epitrochoid)
    // (rl+rs)/rs = ratio
    // r1 = rs * radius
    // r0 + r1 = size
    // r0 = rl + rs

    var k = this.size / (this.ratio + this.r_rad);
    this.rs = k;
    this.rl = k * (this.ratio + (this.inside ? 1 : -1));
    this.r1 = k * this.r_rad;
    this.r0 = k * this.ratio;

    this.update_buffer();
    window.requestAnimationFrame(this.draw.bind(this));
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

