"use strict";

// ************************************************************

function Application(canvas)
{
    WebGLApp.call(this, canvas);
}

Application.prototype = Object.create(WebGLApp.prototype);

Application.prototype.init = function()
{
    this.position_buffer = null;
}

Application.prototype.setup_buffers = function()
{
    this.position_buffer = this.array_buffer([-2,-2, 2,-2, -2,2, 2,2]);
};

Application.prototype.setup_program = function()
{
    var gl = this.ctx;

    this.program = this.create_program('vshader', 'fshader');

    this.v_matrix = gl.getUniformLocation(this.program, 'matrix');
    this.v_texture = gl.getUniformLocation(this.program, 'texture');

    this.a_position = gl.getAttribLocation(this.program, "a_position");
};

Application.prototype.setup_texture = function()
{
    this.texture = this.load_texture("image");
};

Application.prototype.setup = function()
{
    this.setup_texture();
    this.setup_program();
    this.setup_buffers();
    this.check_error();
};

Application.prototype.draw = function()
{
    var gl = this.ctx;

    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(this.program);

    gl.enableVertexAttribArray(this.a_position);

    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.uniform1i(this.v_texture, 0);

    var m = Matrix.perspective(this.camera_fov, this.canvas.height / this.canvas.width, 0.1, 10.0);
    m.postmultiply(Matrix.translate(this.object_pos));
    m.postmultiply(Matrix.rotx(this.object_rot[0], true));
    m.postmultiply(Matrix.roty(this.object_rot[1], true));
    m.postmultiply(Matrix.rotz(this.object_rot[2], true));
    m.invert();
    gl.uniformMatrix4fv(this.v_matrix, false, new Float32Array(m.as_array()));

    gl.bindBuffer(gl.ARRAY_BUFFER, this.position_buffer);
    gl.vertexAttribPointer(this.a_position, 2, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    gl.disableVertexAttribArray(this.a_position);

    gl.useProgram(null);

    gl.flush();
    
    this.check_error();
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

