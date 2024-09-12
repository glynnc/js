"use strict";

// ************************************************************

function Application(canvas)
{
    WebGLApp.call(this, canvas);
}

Application.prototype = Object.create(WebGLApp.prototype);

Application.prototype.init = function()
{
    this.start_camera_scale = 2.0;
    this.camera_scale = this.start_camera_scale;

    this.program = null;

    this.v_matrix = null;
    this.v_scale = null;
    this.v_cubemap = null;

    this.a_position = null;
    this.a_texcoord = null;

    this.position_buffer = null;
    this.texcoord_buffer = null;

    this.cubemap = null;
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

    this.v_matrix     = gl.getUniformLocation(this.program, 'matrix');
    this.v_scale      = gl.getUniformLocation(this.program, 'scale');
    this.v_cubemap    = gl.getUniformLocation(this.program, 'cubemap');

    this.a_position = gl.getAttribLocation(this.program, "a_position");
    this.a_texcoord = gl.getAttribLocation(this.program, "a_texcoord");

    this.check_error();
};

Application.prototype.setup_buffers = function()
{
    var gl = this.ctx;

    var verts = [-1,-1,  1,-1, -1, 1,  1, 1];
    this.position_buffer = this.array_buffer(verts, 0);

    var texco = [-1,-1,  1,-1, -1, 1,  1, 1];
    this.texcoord_buffer = this.array_buffer(texco, 0)

    this.check_error();
};

Application.prototype.setup = function()
{
    this.setup_cubemap();
    this.setup_program();
    this.setup_buffers();
};

Application.prototype.draw = function()
{
    var gl = this.ctx;

    gl.clearColor(0.7, 0.7, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(this.program);

    var m = Matrix.identity();
    m.postmultiply(Matrix.rotz(this.object_rot[2], true));
    m.postmultiply(Matrix.roty(this.object_rot[1], true));
    m.postmultiply(Matrix.rotx(this.object_rot[0], true));

    gl.uniformMatrix4fv(this.v_matrix, false, new Float32Array(m.as_array()));

    gl.uniform1f(this.v_scale, Math.pow(2.0, this.camera_scale));

    gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.cubemap);
    gl.uniform1i(this.v_cubemap, 0);

    gl.enableVertexAttribArray(this.a_position);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.position_buffer);
    gl.vertexAttribPointer(this.a_position, 2, gl.FLOAT, false, 0, 0);

    gl.enableVertexAttribArray(this.a_texcoord);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texcoord_buffer);
    gl.vertexAttribPointer(this.a_texcoord, 2, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    gl.disableVertexAttribArray(this.a_texcoord);
    gl.disableVertexAttribArray(this.a_position);

    gl.useProgram(null);

    gl.flush();
    
    this.check_error();
};

Application.prototype.handle_keys = function(t)
{
    var scale = 1.0;

    if (this.key_state["Alt"]) {
        if (this.key_state["Down"])      this.camera_scale -= scale * t;
        if (this.key_state["Up"])        this.camera_scale += scale * t;
    }
    else {
	WebGLApp.prototype.handle_keys.call(this, t);
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

