"use strict";

// ************************************************************

function Application(canvas)
{
    WebGLApp.call(this, canvas);
}

Application.prototype = Object.create(WebGLApp.prototype);

Application.prototype.init = function()
{
    this.grid_x = 6;
    this.grid_y = 10;
    this.min_height = 1;
    this.max_height = 5;
    this.start_object_pos = [-(this.grid_x-1)/2, -0.1, 0];
    this.program = null;

    this.v_matrix = null;

    this.a_position = null;

    this.position_buffer = null;
    this.num_indices = null;
    this.indices_buffer = null;
};

Application.prototype.setup_buffers = function()
{
    var gl = this.ctx;

    var verts = [];
    var indices = [];
    for (var y = 0; y < this.grid_y; y++) {
        for (var x = 0; x < this.grid_x; x++) {
            var ix = verts.length;
            verts.push([x, 0, -y]);
            if (x > 0)
                indices.push([ix-1, ix]);
            if (y > 0)
                indices.push([ix-this.grid_x, ix]);
        }
    }

    for (var y = 0; y < this.grid_y; y+=2) {
        for (var x = 0; x < this.grid_x; x+=2) {
            var z = this.min_height + Math.random() * (this.max_height - this.min_height);
            var dx = 1;
            var dy = this.grid_x;
            var ix0 = y * this.grid_x + x;
            var ix = verts.length;
            verts.push([x+0, z, -(y+0)]);
            verts.push([x+1, z, -(y+0)]);
            verts.push([x+0, z, -(y+1)]);
            verts.push([x+1, z, -(y+1)]);
            indices.push([ix0, ix+0, ix0+dx, ix+1, ix0+dy, ix+2, ix0+dy+dx, ix+3]);
            indices.push([ix+0, ix+1, ix+2, ix+3, ix+0, ix+2, ix+1, ix+3]);
        }
    }

    verts = this.flatten(verts, 1);
    indices = this.flatten(indices, 1);

    this.position_buffer = this.array_buffer(verts);
    this.indices_buffer  = this.index_buffer(indices);
    this.num_indices = indices.length;

    this.check_error();
};

Application.prototype.setup = function()
{
    var gl = this.ctx;
    this.setup_program();
    this.setup_buffers();
    this.check_error();
};

Application.prototype.setup_program = function()
{
    var gl = this.ctx;

    this.program = this.create_program('vshader', 'fshader');

    this.v_matrix = gl.getUniformLocation(this.program, 'matrix');
    this.v_color  = gl.getUniformLocation(this.program, 'color');

    this.a_position = gl.getAttribLocation(this.program, "a_position");
};

Application.prototype.draw = function()
{
    var gl = this.ctx;

    var w = this.canvas.width;
    var h = this.canvas.height;

    gl.viewport(0, 0, w, h);

    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.enable(gl.DEPTH_TEST);

    gl.useProgram(this.program);

    gl.uniform4f(this.v_color, 0, 1, 0, 1);

    var m_mview = Matrix.translate(this.object_pos);
    m_mview.postmultiply(Matrix.rotx(this.object_rot[0], true));
    m_mview.postmultiply(Matrix.roty(this.object_rot[1], true));
    m_mview.postmultiply(Matrix.rotz(this.object_rot[2], true));

    var m_persp = Matrix.perspective(this.camera_fov, h / (w/3), 0.1, 20.0);

    gl.enableVertexAttribArray(this.a_position);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.position_buffer);
    gl.vertexAttribPointer(this.a_position, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indices_buffer);

    gl.viewport(0, 0, w/3, h);
    var m1 = Matrix.rotx(90, true);
    m1.postmultiply(m_persp);
    m1.postmultiply(m_mview);
    gl.uniformMatrix4fv(this.v_matrix, false, new Float32Array(m1.as_array()));
    gl.drawElements(gl.LINES, this.num_indices, gl.UNSIGNED_SHORT, 0);

    gl.viewport(w/3, 0, w/3, h);
    var m2 = Matrix.multiply(m_persp,m_mview);
    gl.uniformMatrix4fv(this.v_matrix, false, new Float32Array(m2.as_array()));
    gl.drawElements(gl.LINES, this.num_indices, gl.UNSIGNED_SHORT, 0);

    gl.viewport(2*w/3, 0, w/3, h);
    var m3 = Matrix.roty(90, true);
    m3.postmultiply(m_persp);
    m3.postmultiply(m_mview);
    gl.uniformMatrix4fv(this.v_matrix, false, new Float32Array(m3.as_array()));
    gl.drawElements(gl.LINES, this.num_indices, gl.UNSIGNED_SHORT, 0);

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

