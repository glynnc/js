"use strict";

// ************************************************************

function Application(canvas, parent)
{
    this.parent = parent;
    WebGLApp.call(this, canvas);
}

Application.prototype = Object.create(WebGLApp.prototype);

Application.prototype.init = function()
{
    this.start_object_pos = [0, 0, -2.5];
    this.ortho = !!this.parent;

    this.program = null;
    this.texture = null;
    this.matrix = null;

    this.v_matrix = null;
    this.v_texture = null;
    this.a_position = null;
    this.a_texcoord = null;

    this.verts = null;
    this.texco = null;
    this.indices = null;

    this.num_indices = null;
    this.position_buffer = null;
    this.texcoord_buffer = null;
    this.indices_buffer = null;
};

Application.prototype.make_check = function()
{
    var colors = [
        [[1,0,0],[0,1,0],[0,0,1],[0,0,0]],
        [[0,1,1],[1,0,1],[1,1,0],[0,0,0]]
        ];
    var block = 64;
    var tile = 4;
    var w = block * 4;
    var h = block * 2;
    var data = new Uint8Array(w * h * 4);
    var ix = 0;
    for (var y = 0; y < h; y++) {
        for (var x = 0; x < w; x++) {
            var i = Math.floor(x / block);
            var j = Math.floor(y / block);
            var t = (Math.floor(x / tile) ^ Math.floor(y / tile)) & 1;
            var c = colors[j][i];
            data[ix++] = Math.floor(((c[0] + t) / 2) * 255);
            data[ix++] = Math.floor(((c[1] + t) / 2) * 255);
            data[ix++] = Math.floor(((c[2] + t) / 2) * 255);
            data[ix++] = 255;
        }
    }

    this.texture = this.make_texture(data, w, h);
};

Application.prototype.setup = function()
{
    this.create(this);
    this.setup_program();
    this.make_check();
    this.check_error();
};

Application.prototype.add_block = function(x0, x1, y0, y1, z0, z1)
{
    var sx = (x1 - x0) / 2;
    var sy = (y1 - y0) / 2;
    var sz = (z1 - z0) / 2;

    var tx0 = 0.00;
    var tx1 = 0.25;
    var tx2 = 0.50;

    var ty0 = 0.00;
    var ty1 = 0.50;

    var verts = [
        [[x0,y0,z0], [x1,y0,z0], [x0,y1,z0], [x1,y1,z0]], // z0
        [[x0,y0,z1], [x1,y0,z1], [x0,y1,z1], [x1,y1,z1]], // z1
        [[x0,y0,z0], [x1,y0,z0], [x0,y0,z1], [x1,y0,z1]], // y0
        [[x0,y1,z0], [x1,y1,z0], [x0,y1,z1], [x1,y1,z1]], // y1
        [[x0,y0,z0], [x0,y0,z1], [x0,y1,z0], [x0,y1,z1]], // x0
        [[x1,y0,z0], [x1,y0,z1], [x1,y1,z0], [x1,y1,z1]]  // x1
        ];

    var texco = [
        [[tx0+0,ty0+0], [tx0+sx/4,ty0+0], [tx0+0,ty0+sy/2], [tx0+sx/4,ty0+sy/2]], // z0
        [[tx1+0,ty0+0], [tx1+sx/4,ty0+0], [tx1+0,ty0+sy/2], [tx1+sx/4,ty0+sy/2]], // z1
        [[tx2+0,ty0+0], [tx2+sx/4,ty0+0], [tx2+0,ty0+sz/2], [tx2+sx/4,ty0+sz/2]], // y0
        [[tx0+0,ty1+0], [tx0+sx/4,ty1+0], [tx0+0,ty1+sz/2], [tx0+sx/4,ty1+sz/2]], // y1
        [[tx1+0,ty1+0], [tx1+sz/4,ty1+0], [tx1+0,ty1+sy/2], [tx1+sz/4,ty1+sy/2]], // x0
        [[tx2+0,ty1+0], [tx2+sz/4,ty1+0], [tx2+0,ty1+sy/2], [tx2+sz/4,ty1+sy/2]], // x1
        ];

    for (var face = 0; face < 6; face++) {
        var ix = this.verts.length;
        for (var vert = 0; vert < 4; vert++) {
            this.verts.push(verts[face][vert]);
            this.texco.push(texco[face][vert]);
        }
        this.indices.push([ix+0, ix+1, ix+2, ix+2, ix+1, ix+3]);
    }
};

Application.prototype.create = function()
{
    this.verts = [];
    this.texco = [];
    this.indices = [];

    var z = -0.9;
    var h_max = -z;
    var dx = 0.4;
    var dy = 0.4;

    this.add_block(-1, 1, -1, z, -1, 1);

    for (var y = -1; y < 0.999; y += 2 * dy) {
        for (var x = -1; x < 0.999; x += 2 * dx) {
            var dz = 1 + Math.random() * h_max;
            this.add_block(x, x+dx, z, z+dz, y,y+dy);
        }
    }

    this.indices = this.flatten(this.indices, 1);

    this.nverts = this.verts.length;
    this.position_buffer = this.array_buffer(this.verts, 1);
    this.texcoord_buffer = this.array_buffer(this.texco, 1);
    this.indices_buffer  = this.index_buffer(this.indices);
    this.num_indices = this.indices.length;

    //this.verts = null;
    //this.texco = null;
    //this.indices = null;
};

Application.prototype.setup_program = function()
{
    var gl = this.ctx;

    this.program = this.create_program('vshader', 'fshader');

    this.v_matrix  = gl.getUniformLocation(this.program, 'u_matrix');
    this.v_texture = gl.getUniformLocation(this.program, 'u_texture');

    this.a_position = gl.getAttribLocation(this.program, "a_position");
    this.a_texcoord = gl.getAttribLocation(this.program, "a_texcoord");
};

Application.prototype.draw = function()
{
    var gl = this.ctx;

    gl.clearColor(0.5, 0.5, 1.0, 1.0);
    //gl.clearDepth(this.parent ? 0.0 : 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    //gl.depthFunc(this.parent ? gl.GREATER : gl.LESS);
    gl.useProgram(this.program);

    gl.uniformMatrix4fv(this.v_matrix, false, new Float32Array(this.matrix.as_array()));
    gl.uniform1i(this.v_texture, 0);

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.texture);

    gl.enableVertexAttribArray(this.a_position);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.position_buffer);
    gl.vertexAttribPointer(this.a_position, 3, gl.FLOAT, false, 0, 0);

    gl.enableVertexAttribArray(this.a_texcoord);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texcoord_buffer);
    gl.vertexAttribPointer(this.a_texcoord, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indices_buffer);

    gl.drawElements(gl.TRIANGLES, this.num_indices, gl.UNSIGNED_SHORT, 0);

    gl.disableVertexAttribArray(this.a_texcoord);
    gl.disableVertexAttribArray(this.a_position);

    gl.flush();
    
    this.check_error();
};

Application.prototype.key_press = function(event)
{
    WebGLApp.prototype.key_press.call(this, event);

    var key = event.key.toLowerCase();

    if (key == "o")
        this.ortho = !this.ortho;
    else if (key == "t")
        this.object_rot = [ 90,   0, 0];
    else if (key == "b")
        this.object_rot = [-90,   0, 0];
    else if (key == "r")
        this.object_rot = [  0,  90, 0];
    else if (key == "l")
        this.object_rot = [  0, -90, 0];
    else if (key == "f")
        this.object_rot = [  0,   0, 0];
    else if (key == "b")
        this.object_rot = [  0, 180, 0];
};

Application.prototype.update = function(t)
{
    var m = new Matrix();

    var p = (this.ortho
             ? Matrix.ortho(-2, 2, -2, 2, -10, 10)
             : Matrix.perspective(this.camera_fov, this.canvas.height / this.canvas.width, 0.5, 3.0));
    m.postmultiply(p);

    m.postmultiply(Matrix.translate(this.object_pos));
    m.postmultiply(Matrix.rotx(this.object_rot[0], true));
    m.postmultiply(Matrix.roty(this.object_rot[1], true));
    m.postmultiply(Matrix.rotz(this.object_rot[2], true));

    if (this.parent) {
        m.postmultiply(Matrix.scale(1,1,-1));
        m.postmultiply(this.parent.matrix);
    }
    
    this.matrix = m;

};

// ************************************************************

var app1 = null;
var app2 = null;

function do_update()
{
    app1.refresh(15);
    app2.refresh(15);
}
    
function init()
{
    var canvas1 = document.getElementById("canvas1");
    app1 = new Application(canvas1);
    var canvas2 = document.getElementById("canvas2");
    app2 = new Application(canvas2, app1);

    setInterval(do_update.bind(this), 15);
}

// ************************************************************

