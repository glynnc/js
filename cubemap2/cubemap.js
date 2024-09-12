"use strict";

// ************************************************************

function Application(canvas)
{
    WebGLApp.call(this, canvas);
}

Application.prototype = Object.create(WebGLApp.prototype);

Application.prototype.init = function()
{
    this.program = null;

    this.v_proj = null;
    this.v_view = null;
    this.v_cubemap = null;

    this.a_position = null;

    this.position_buffer = null;
    this.indices_buffer = null;

    this.cubemap = null;

    this.start_object_pos = [0, 0, 0];
    this.object_pos = this.start_object_pos.slice();
};

Application.prototype.setup_cubemap = function()
{
    var names = ["posx", "posy", "posz", "negx", "negy", "negz"];
    this.cubemap = this.make_cubemap(names);
};

Application.prototype.setup_program = function()
{
    var gl = this.ctx;

    this.program = this.create_program('vshader', 'fshader');

    this.v_proj     = gl.getUniformLocation(this.program, 'proj');
    this.v_view     = gl.getUniformLocation(this.program, 'view');
    this.v_cubemap    = gl.getUniformLocation(this.program, 'cubemap');

    this.a_position = gl.getAttribLocation(this.program, "a_position");

    this.check_error();
};

Application.prototype.setup_buffers = function()
{
    var gl = this.ctx;

    var verts = [-1,-1,-1, -1,-1,1, -1,1,-1, -1,1,1, 1,-1,-1, 1,-1,1, 1,1,-1, 1,1,1];
    this.position_buffer = this.array_buffer(verts, 0);

    var indices = [0,1,2,2,1,3, 4,5,6,6,5,7, 0,1,4,4,1,5, 2,3,6,6,3,7, 0,2,4,4,2,6, 1,3,5,5,3,7];
    this.indices_buffer = this.index_buffer(indices, 0);

    this.check_error();
};

Application.prototype.setup = function()
{
    var gl = this.ctx;

    this.setup_cubemap();
    this.setup_program();
    this.setup_buffers();

    gl.disable(gl.CULL_FACE);
    gl.disable(gl.DEPTH_TEST);
};

Application.prototype.perspective = function()
{
    var n = 0.01, f = 10.0;
    var fov = this.camera_fov * Math.PI / 180;
    var F = 1 / Math.tan(fov/2);
    var k = n / F;
    var r = k, t = k;

    if (this.canvas.height > this.canvas.width)
	r *= this.canvas.width / this.canvas.height;
    else
	t *= this.canvas.height / this.canvas.width;

    return Matrix.frustum(-r, r, -t, t, n, f);
}

Application.prototype.draw = function()
{
    var gl = this.ctx;

    gl.clearColor(0.7, 0.7, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(this.program);

    gl.uniformMatrix4fv(this.v_proj, false, new Float32Array(this.perspective().as_array()));

    var m = Matrix.identity();
    m.postmultiply(Matrix.translate(this.object_pos));
    m.postmultiply(Matrix.rotx(this.object_rot[0], true));
    m.postmultiply(Matrix.roty(this.object_rot[1], true));
    m.postmultiply(Matrix.rotz(this.object_rot[2], true));
    m.postmultiply(Matrix.scale(1,1,-1));
    gl.uniformMatrix4fv(this.v_view, false, new Float32Array(m.as_array()));

    gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.cubemap);
    gl.uniform1i(this.v_cubemap, 0);

    gl.enableVertexAttribArray(this.a_position);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.position_buffer);
    gl.vertexAttribPointer(this.a_position, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indices_buffer);

    gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);

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

