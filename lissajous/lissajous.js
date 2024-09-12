"use strict";

// ************************************************************

function Application(canvas)
{
    WebGLApp.call(this, canvas);
}

Application.prototype = Object.create(WebGLApp.prototype);

Application.prototype.axes = ['x','y','z'];

Application.prototype.init = function()
{
    this.steps = 1000;

    this.program = null;
    this.v_matrix = null;
    this.v_frequency = null;
    this.v_phase = null;
    this.a_param = null;

    this.param = null;
    this.param_buffer = null;
    this.param_count = null;

    this.inputs = [];
    for (var i = 0; i < this.axes.length; i++) {
        var axis = this.axes[i];
        var elem = document.getElementById("frequency_" + axis);
        this.inputs.push(elem);
    }

    this.frequency = new Float32Array([3, 7, 11]);
    this.phase = new Float32Array([0, 0, 0]);
    this.delta = new Float32Array([0.007, 0.011, 0.003]);

    this.update_buffer();
    this.update_page();
    this.update_frequency();
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

    this.v_matrix    = gl.getUniformLocation(this.program, 'matrix');
    this.v_frequency = gl.getUniformLocation(this.program, 'frequency');
    this.v_phase     = gl.getUniformLocation(this.program, 'phase');

    this.a_param = gl.getAttribLocation(this.program, "a_param");
};

Application.prototype.draw = function()
{
    var gl = this.ctx;
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.disable(gl.DEPTH_TEST);
    gl.useProgram(this.program);

    gl.uniform3fv(this.v_frequency, this.frequency);
    gl.uniform3fv(this.v_phase, this.phase);

    var m = Matrix.perspective(this.camera_fov, this.canvas.height / this.canvas.width, 0.1, 10.0);
    m.postmultiply(Matrix.translate(this.object_pos));
    m.postmultiply(Matrix.rotx(this.object_rot[0], true));
    m.postmultiply(Matrix.roty(this.object_rot[1], true));
    m.postmultiply(Matrix.rotz(this.object_rot[2], true));
    gl.uniformMatrix4fv(this.v_matrix, false, new Float32Array(m.as_array()));

    gl.enableVertexAttribArray(this.a_param);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.param_buffer);
    gl.vertexAttribPointer(this.a_param, 1, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.LINE_LOOP, 0, this.param_count);
    gl.flush();

    this.check_error();
};

Application.prototype.update_buffer = function()
{
    var gl = this.ctx;

    this.param_count = this.steps;
    var param = [];
    for (var i = 0; i < this.param_count; i++)
	param.push(i / this.steps);
    if (this.param_buffer != null)
	gl.deleteBuffer(this.param_buffer);
    this.param = param;
    this.param_buffer = this.array_buffer(param);
};

Application.prototype.update_page = function()
{
    for (var i = 0; i < this.axes.length; i++)
        this.inputs[i].value = "" + this.frequency[i];
};

Application.prototype.update_frequency = function()
{
    for (var i = 0; i < this.axes.length; i++)
        this.frequency[i] = Number(this.inputs[i].value);

    this.update_page();
};

Application.prototype.update = function(t)
{
    for (var i = 0; i < this.axes.length; i++)
        this.phase[i] += t * this.delta[i];
};

// ************************************************************

var app = null;

function init()
{
    var canvas = document.getElementById("canvas");
    app = new Application(canvas);
    window.setInterval(app.refresh.bind(app), 15);
}

// ************************************************************

