"use strict";

// ************************************************************

function Application(canvas)
{
    WebGLApp.call(this, canvas);
}

Application.prototype = Object.create(WebGLApp.prototype);

Application.prototype.slice_cubes = [
    [ 0, 1, 2,  3, 4, 5,  6, 7, 8], // 0 left   yellow   X0
    [ 9,10,11, 12,13,14, 15,16,17], // 1 	         X1
    [18,19,20, 21,22,23, 24,25,26], // 2 right  green    X2

    [ 0, 9,18,  1,10,19,  2,11,20], // 3 bottom magenta  Y0
    [ 3,12,21,  4,13,22,  5,14,23], // 4 	         Y1
    [ 6,15,24,  7,16,25,  8,17,26], // 5 top    white    Y2

    [ 0, 3, 6,  9,12,15, 18,21,24], // 6 back   blue     Z0
    [ 1, 4, 7, 10,13,16, 19,22,25], // 7	         Z1
    [ 2, 5, 8, 11,14,17, 20,23,26], // 8 front  red      Z2
    ];

Application.prototype.matrices = [
    new Matrix([ 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]),
    new Matrix([ 1, 0, 0, 0, 0, 0,-1, 0, 0, 1, 0, 0, 0, 0, 0, 1]),
    new Matrix([ 1, 0, 0, 0, 0, 0, 1, 0, 0,-1, 0, 0, 0, 0, 0, 1]),
    new Matrix([ 0, 0, 1, 0, 0, 1, 0, 0,-1, 0, 0, 0, 0, 0, 0, 1]),
    new Matrix([ 0, 0,-1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1]),
    new Matrix([ 0,-1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]),
    new Matrix([ 0, 1, 0, 0,-1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]),
    new Matrix([ 0, 1, 0, 0, 0, 0,-1, 0,-1, 0, 0, 0, 0, 0, 0, 1]),
    new Matrix([ 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 1]),
    new Matrix([ 0, 0, 1, 0,-1, 0, 0, 0, 0,-1, 0, 0, 0, 0, 0, 1]),
    new Matrix([ 0, 0,-1, 0,-1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1]),
    new Matrix([-1, 0, 0, 0, 0,-1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]),
    new Matrix([ 1, 0, 0, 0, 0,-1, 0, 0, 0, 0,-1, 0, 0, 0, 0, 1]),
    new Matrix([ 0,-1, 0, 0, 0, 0, 1, 0,-1, 0, 0, 0, 0, 0, 0, 1]),
    new Matrix([ 0, 0,-1, 0, 1, 0, 0, 0, 0,-1, 0, 0, 0, 0, 0, 1]),
    new Matrix([ 0,-1, 0, 0, 0, 0,-1, 0, 1, 0, 0, 0, 0, 0, 0, 1]),
    new Matrix([ 0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1]),
    new Matrix([-1, 0, 0, 0, 0, 1, 0, 0, 0, 0,-1, 0, 0, 0, 0, 1]),
    new Matrix([-1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1]),
    new Matrix([-1, 0, 0, 0, 0, 0,-1, 0, 0,-1, 0, 0, 0, 0, 0, 1]),
    new Matrix([ 0,-1, 0, 0,-1, 0, 0, 0, 0, 0,-1, 0, 0, 0, 0, 1]),
    new Matrix([ 0, 1, 0, 0, 1, 0, 0, 0, 0, 0,-1, 0, 0, 0, 0, 1]),
    new Matrix([ 0, 0,-1, 0, 0,-1, 0, 0,-1, 0, 0, 0, 0, 0, 0, 1]),
    new Matrix([ 0, 0, 1, 0, 0,-1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1])
    ];;

Application.prototype.transitions = [
    [[ 1,  2], [ 3,  4], [ 5,  6]],
    [[12,  0], [ 7, 15], [16, 10]],
    [[ 0, 12], [13,  8], [14,  9]],
    [[16,  9], [17,  0], [13,  7]],
    [[10, 14], [ 0, 17], [15,  8]],
    [[15, 13], [16, 14], [11,  0]],
    [[ 7,  8], [ 9, 10], [ 0, 11]],
    [[21,  6], [19,  1], [ 3, 22]],
    [[ 6, 21], [ 2, 18], [ 4, 23]],
    [[ 3, 23], [20,  6], [ 2, 19]],
    [[22,  4], [ 6, 20], [ 1, 18]],
    [[19, 18], [23, 22], [ 6,  5]],
    [[ 2,  1], [22, 23], [21, 20]],
    [[ 5, 20], [18,  2], [22,  3]],
    [[ 4, 22], [ 5, 21], [19,  2]],
    [[20,  5], [ 1, 19], [23,  4]],
    [[23,  3], [21,  5], [18,  1]],
    [[18, 19], [ 4,  3], [20, 21]],
    [[11, 17], [ 8, 13], [10, 16]],
    [[17, 11], [15,  7], [ 9, 14]],
    [[13, 15], [10,  9], [12, 17]],
    [[ 8,  7], [14, 16], [17, 12]],
    [[14, 10], [11, 12], [ 7, 13]],
    [[ 9, 16], [12, 11], [ 8, 15]]
    ];

Application.prototype.perms = [
    [2,5,8, 1,4,7, 0,3,6],
    [6,3,0, 7,4,1, 8,5,2]];

Application.prototype.init = function()
{
    var deg = Math.PI / 180;
    this.start_object_pos = [0, 0, -20];
    this.start_object_rot = [Math.atan(Math.cos(45 * deg)) / deg, -45, 0];
    this.start_camera_fov = 45;
    this.ortho = false;

    this.material_specular  = [1.0, 1.0, 1.0];
    this.material_shininess = 10.0;

    this.light_diffuse  = [0.7, 0.7, 0.7];
    this.light_ambient  = [0.3, 0.3, 0.3];
    this.light_specular = [1.0, 1.0, 1.0];

    this.xforms = null;
    this.cubes = null;
    this.undo_list = [];

    this.anim_time = null;
    this.anim_start    = null;
    this.anim_update   = null;
    this.anim_finish   = null;
    this.turn_duration = 0.4;
    this.flip_duration = 0.25;
    this.shuffle_duration = 0.2;

    this.cube          = null;
    this.texture       = null;
    this.program       = null;

    this.a_position    = null;
    this.a_normal      = null;
    this.a_texcoord    = null;
    this.a_xform       = null;

    this.v_mview_mat   = null;
    this.v_normal_mat  = null;
    this.v_proj_mat    = null;
    this.v_xforms      = null;
    this.v_l_ambient   = null;
    this.v_l_diffuse   = null;
    this.v_l_specular  = null;
    this.v_m_specular  = null;
    this.v_m_shininess = null;
    this.v_texture     = null;

    this.arrows        = null;
    this.arrows_model  = null;
    this.arrows_tex    = null;
    this.arrows_pgm    = null;

    this.aa_position   = null;
    this.aa_texcoord   = null;

    this.va_mview_mat   = null;
    this.va_proj_mat    = null;
    this.va_texture     = null;

    this.turn_slice    = null;
    this.turn_dir      = null;
    this.turn_cubes    = null;
    this.start_xforms  = null;
    this.flip_start    = null;
    this.flip_end      = null;
    this.shuffle_moves = null;
};

Application.prototype.setup_programs = function()
{
    var gl = this.ctx;

    this.program = this.create_program('vshader', 'fshader');

    this.a_position    = gl.getAttribLocation(this.program, "a_position");
    this.a_normal      = gl.getAttribLocation(this.program, "a_normal");
    this.a_texcoord    = gl.getAttribLocation(this.program, "a_texcoord");
    this.a_xform       = gl.getAttribLocation(this.program, "a_xform");

    this.v_mview_mat   = gl.getUniformLocation(this.program, "mview");
    this.v_normal_mat  = gl.getUniformLocation(this.program, "mnorm");
    this.v_proj_mat    = gl.getUniformLocation(this.program, "mproj");
    this.v_xforms      = gl.getUniformLocation(this.program, "xforms");

    this.v_l_ambient   = gl.getUniformLocation(this.program, "l_ambient");
    this.v_l_diffuse   = gl.getUniformLocation(this.program, "l_diffuse");
    this.v_l_specular  = gl.getUniformLocation(this.program, "l_specular");
    this.v_m_specular  = gl.getUniformLocation(this.program, "m_specular");
    this.v_m_shininess = gl.getUniformLocation(this.program, "m_shininess");
    this.v_texture     = gl.getUniformLocation(this.program, "texture");

    this.arrows_pgm = this.create_program('vshader_arrows', 'fshader_arrows');

    this.aa_position   = gl.getAttribLocation(this.arrows_pgm, "a_position");
    this.aa_texcoord   = gl.getAttribLocation(this.arrows_pgm, "a_texcoord");

    this.va_mview_mat  = gl.getUniformLocation(this.arrows_pgm, "mview");
    this.va_proj_mat   = gl.getUniformLocation(this.arrows_pgm, "mproj");
    this.va_texture    = gl.getUniformLocation(this.arrows_pgm, "texture");
};

Application.prototype.setup_buffers = function(model)
{
    var mesh = {};

    mesh.position_buffer = this.array_buffer(this.flatten(model.verts, 1));
    mesh.texcoord_buffer = this.array_buffer(this.flatten(model.texco, 1));
    mesh.normal_buffer   = this.array_buffer(this.flatten(model.norms, 1));
    mesh.xform_buffer    = this.array_buffer(this.flatten(model.xform, 0));

    var faces = this.flatten(model.faces, 1);
    mesh.indices_buffer  = this.index_buffer(faces);
    mesh.num_indices     = faces.length;

    this.check_error();

    return mesh;
};

Application.prototype.make_arrows = function()
{
    var model = {};
    model.verts = [];
    model.norms = [];
    model.texco = [];
    model.xform = [];
    model.faces = [];

    for (var a = 0; a < 3; a++) {
        var a0 = a;
        var a1 = (a+1)%3;
        var a2 = (a+2)%3;
        for (var x = 0; x < 2; x++) {
            for (var y = 0; y < 2; y++) {
                var u = x * 2 - 1;
                var v = y * 2 - 1;
                var base = model.verts.length;
                var norm = [null,null,null];
                norm[a0] = 0;
                norm[a1] = v;
                norm[a2] = -u;
                var n = vector_normalize(norm);
                for (var i = 0; i < 4; i++) {
                    for (var j = 0; j < 2; j++) {
                        var t = [i / 3, 0.18 + j * 0.64];
                        var p = [null,null,null];
                        p[a0] = i * 2 - 3;
                        var r = 3.2 + j;
                        p[a1] = r * u;
                        p[a2] = r * v;
                        model.verts.push(p);
                        model.norms.push(n);
                        model.texco.push(t);
                        model.xform.push(27);
                    }
                }
                for (var i = 0; i < 3; i++) {
                    var b = base + 2 * i;
                    model.faces.push([b+0,b+1,b+2]);
                    model.faces.push([b+2,b+1,b+3]);
                }
            }
        }
    }

    return model;
};

Application.prototype.setup_model = function()
{
    this.cube = this.setup_buffers(cube_model);
    this.arrows_model = this.make_arrows();
    this.arrows = this.setup_buffers(this.arrows_model);
};

Application.prototype.setup_texture = function()
{
    this.texture = this.load_texture("texture");
    this.arrows_tex = this.load_texture("arrows");
};

Application.prototype.setup_xforms = function()
{
    this.cubes = [];
    this.xforms = [];
    for (var i = 0; i < 3*3*3; i++) {
	this.cubes.push([i, 0]);
	this.xforms.push(Matrix.identity());
    }
    this.xforms.push(Matrix.identity());
};

Application.prototype.setup = function()
{
    this.setup_xforms();
    this.setup_programs();
    this.setup_texture();
    this.setup_model();
};

Application.prototype.modelview = function()
{
    var m = new Matrix();
    m.postmultiply(Matrix.translate(this.object_pos));
    m.postmultiply(Matrix.rotx(this.object_rot[0], true));
    m.postmultiply(Matrix.roty(this.object_rot[1], true));
    m.postmultiply(Matrix.rotz(this.object_rot[2], true));
    return m;
};

Application.prototype.projection = function()
{
    var aspect = this.canvas.height / this.canvas.width;
    var scale = 8;
    var near = 0.1;
    var far = 30.0;
    return this.ortho
        ? Matrix.ortho(-scale, scale, -scale * aspect, scale * aspect, near, far)
        : Matrix.perspective(this.camera_fov, aspect, near, far);
};

Application.prototype.draw_cube = function(modelview_mat, normal_mat, projection_mat)
{
    var gl = this.ctx;

    var xforms_array = [];
    for (var i = 0; i < this.xforms.length; i++) {
	var a = this.xforms[i].as_array();
	for (var j = 0; j < a.length; j++)
	    xforms_array.push(a[j]);
    }

    gl.useProgram(this.program);

    gl.uniformMatrix4fv(this.v_mview_mat,  false, new Float32Array(modelview_mat));
    gl.uniformMatrix3fv(this.v_normal_mat, false, new Float32Array(normal_mat));
    gl.uniformMatrix4fv(this.v_proj_mat,   false, new Float32Array(projection_mat));
    gl.uniformMatrix4fv(this.v_xforms,     false, new Float32Array(xforms_array));
    gl.uniform3fv(this.v_l_ambient, this.light_ambient);
    gl.uniform3fv(this.v_l_diffuse, this.light_diffuse);
    gl.uniform3fv(this.v_l_specular, this.light_specular);
    gl.uniform3fv(this.v_m_specular, this.material_specular);
    gl.uniform1f(this.v_m_shininess, this.material_shininess);
    gl.uniform1i(this.v_texture, 0);

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.texture);

    gl.enableVertexAttribArray(this.a_position);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.cube.position_buffer);
    gl.vertexAttribPointer(this.a_position, 3, gl.FLOAT, false, 0, 0);

    gl.enableVertexAttribArray(this.a_texcoord);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.cube.texcoord_buffer);
    gl.vertexAttribPointer(this.a_texcoord, 2, gl.FLOAT, true, 0, 0);

    gl.enableVertexAttribArray(this.a_normal);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.cube.normal_buffer);
    gl.vertexAttribPointer(this.a_normal, 3, gl.FLOAT, true, 0, 0);

    gl.enableVertexAttribArray(this.a_xform);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.cube.xform_buffer);
    gl.vertexAttribPointer(this.a_xform, 1, gl.FLOAT, true, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.cube.indices_buffer);

    gl.drawElements(gl.TRIANGLES, this.cube.num_indices, gl.UNSIGNED_SHORT, 0);

    gl.useProgram(null);
};

Application.prototype.draw_arrows = function(modelview_mat, normal_mat, projection_mat)
{
    var gl = this.ctx;

    gl.useProgram(this.arrows_pgm);
    
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.uniformMatrix4fv(this.va_mview_mat,  false, new Float32Array(modelview_mat));
    gl.uniformMatrix4fv(this.va_proj_mat,   false, new Float32Array(projection_mat));
    gl.uniform1i(this.va_texture, 0);

    gl.bindTexture(gl.TEXTURE_2D, this.arrows_tex);

    gl.enableVertexAttribArray(this.aa_position);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.arrows.position_buffer);
    gl.vertexAttribPointer(this.aa_position, 3, gl.FLOAT, false, 0, 0);

    gl.enableVertexAttribArray(this.aa_texcoord);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.arrows.texcoord_buffer);
    gl.vertexAttribPointer(this.aa_texcoord, 2, gl.FLOAT, true, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.arrows.indices_buffer);

    gl.drawElements(gl.TRIANGLES, this.arrows.num_indices, gl.UNSIGNED_SHORT, 0);

    gl.disable(gl.BLEND);

    gl.useProgram(null);
};

Application.prototype.draw = function()
{
    var gl = this.ctx;

    gl.clearColor(0.5, 0.5, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var modelview_mat = this.modelview().as_array();
    var m = modelview_mat;
    var normal_mat = [m[0],m[1],m[2],m[4],m[5],m[6],m[8],m[9],m[10]];
    var projection_mat = this.projection().as_array();

    gl.enable(gl.DEPTH_TEST);

    this.draw_cube(modelview_mat, normal_mat, projection_mat);

    if (this.flip_start == null)
	this.draw_arrows(modelview_mat, normal_mat, projection_mat);

    gl.flush();

    this.check_error();
};

Application.prototype.update_turn = function(duration)
{
    var axes = [[1,0,0],[0,1,0],[0,0,1]];
    var axis = axes[Math.floor(this.turn_slice / 3)];
    if (!duration)
	duration = this.turn_duration;
    var k = (this.anim_time - this.anim_start) / duration;

    var xform = Matrix.rotate(k * 0.5 * Math.PI * this.turn_dir, axis);
    for (var i = 0; i < this.turn_cubes.length; i++) {
	var n = this.turn_cubes[i][0];
	this.xforms[n] = xform.postmultiplied(this.start_xforms[n]);
    }
    return k < 1.0;
};

Application.prototype.end_turn = function()
{
    var slice = this.turn_slice;
    var dir = this.turn_dir < 0 ? 1 : 0;
    var perm = this.perms[dir];
    var cubes = this.slice_cubes[this.turn_slice];
    var axis = Math.floor(slice / 3);
    for (var i = 0; i < 9; i++) {
	var cube_xfrm = this.turn_cubes[perm[i]];
	var cube = cube_xfrm[0];
	var xfrm = cube_xfrm[1];
	this.cubes[cubes[i]] = [cube, this.transitions[xfrm][axis][dir]];
    }

    for (var i = 0; i < this.cubes.length; i++) {
	var cube_xfrm = this.cubes[i];
	var cube = cube_xfrm[0];
	var xfrm = cube_xfrm[1];
	this.xforms[cube] = this.matrices[xfrm];
    }

    this.turn_slice    = null;
    this.turn_dir      = null;
    this.turn_cubes    = null;
    this.start_xforms  = null;
};

Application.prototype.begin_turn = function(slice, reverse)
{
    this.anim_start = this.anim_time;
    this.turn_slice = slice;
    this.turn_dir = reverse ? -1 : 1;
    this.start_xforms = this.xforms.slice();

    this.turn_cubes = [];
    var cubes = this.slice_cubes[this.turn_slice];
    for (var i = 0; i < cubes.length; i++)
	this.turn_cubes.push(this.cubes[cubes[i]]);
};

Application.prototype.start_turn = function(slice, reverse)
{
    if (this.anim_update != null)
	return;

    this.undo_list.push([slice, reverse]);
    this.begin_turn(slice, reverse);

    this.anim_update = this.update_turn;
    this.anim_finish = this.end_turn;
};

Application.prototype.normalize_y = function(y)
{
    return (y + 180 + 360) % 360 - 180;
}

Application.prototype.update_flip = function()
{
    var k = (this.anim_time - this.anim_start) / this.flip_duration;
    this.object_rot[0] = this.flip_start[0] * (1 - k) + this.flip_end[0] * k;
    this.object_rot[1] = this.flip_start[1] * (1 - k) + this.flip_end[1] * k;
    return k < 1.0;
};

Application.prototype.end_flip = function()
{
    this.object_rot[0] = this.flip_end[0];
    this.object_rot[1] = this.normalize_y(this.flip_end[1]);
    this.flip_start = null;
    this.flip_end = null;
};

Application.prototype.start_flip = function()
{
    if (this.anim_update != null)
	return;

    this.anim_start = this.anim_time;
    this.flip_start = this.object_rot.slice(0,2);
    this.flip_end = [-this.flip_start[0], this.flip_start[1] + 180];
    this.anim_update = this.update_flip;
    this.anim_finish = this.end_flip;
};

Application.prototype.start_xflip = function(dir)
{
    if (this.anim_update != null)
	return;

    this.anim_start = this.anim_time;
    this.flip_start = this.object_rot.slice(0,2);
    this.flip_end = [this.start_object_rot[0] * dir, this.flip_start[1]];
    this.anim_update = this.update_flip;
    this.anim_finish = this.end_flip;
};

Application.prototype.start_yflip = function(dir)
{
    if (this.anim_update != null)
	return;

    this.anim_start = this.anim_time;
    this.flip_start = this.object_rot.slice(0,2);
    this.flip_end = [this.flip_start[0], this.flip_start[1] + 90 * dir];
    this.anim_update = this.update_flip;
    this.anim_finish = this.end_flip;
};

Application.prototype.update_shuffle = function()
{
    if (this.turn_slice == null) {
	if (--this.shuffle_moves < 0)
	    return false;

	var slice = Math.floor(Math.random() * this.slice_cubes.length);
	if (slice == this.shuffle_prev)
	    slice = (slice + 1) % 9;
	this.shuffle_prev = slice;

	var reverse = Math.random() < 0.5;

	this.undo_list.push([slice, reverse]);
	this.begin_turn(slice, reverse);
    }

    if (!this.update_turn(this.shuffle_duration))
	this.end_turn();

    return true;
};

Application.prototype.end_shuffle = function()
{
    this.shuffle_moves = null;
    this.shuffle_prev = null;
};

Application.prototype.start_shuffle = function()
{
    if (this.anim_update != null)
	return;

    this.shuffle_moves = 10;
    this.shuffle_prev = null;

    this.anim_update = this.update_shuffle;
    this.anim_finish = this.end_shuffle;
};

Application.prototype.start_undo = function()
{
    if (this.anim_update != null)
	return;

    if (!this.undo_list.length)
	return;

    var last = this.undo_list.pop();
    var slice = last[0];
    var reverse = last[1];
    this.begin_turn(slice, !reverse);

    this.anim_update = this.update_turn;
    this.anim_finish = this.end_turn;
};

Application.prototype.set_ortho = function(ortho)
{
    this.ortho = ortho;
};

Application.prototype.key_press = function(event)
{
    var key = event.key.toLowerCase();
    if (key == "p")
	return this.set_ortho(false);
    if (key == "o")
	return this.set_ortho(true);
    if (key == "del")
	return this.start_undo();
    if (key == "s")
	return this.start_shuffle();
    if (key == " ")
	return this.start_flip();
    if (key == "left")
	return this.start_yflip(-1);
    if (key == "right")
	return this.start_yflip(1);
    if (key == "down")
	return this.start_xflip(1);
    if (key == "up")
	return this.start_xflip(-1);
    var keys = "123456789";
    var slice = keys.search(key);
    var alt = event.altKey;
    if (slice >= 0)
	return this.start_turn(slice, alt);
};

Application.prototype.find_mouse = function(x, y)
{
    var pos = [x,y,1,1];

    var proj = this.projection();
    var mv = this.modelview();
    var mat = Matrix.multiply(proj, mv);

    var verts = [];
    var arrows = this.arrows_model;
    for (var i = 0; i < arrows.verts.length; i++) {
        var v = mat.transform(arrows.verts[i]);
        verts.push([v[0]/v[3], v[1]/v[3], 1]);
    }

    for (var i = 0; i < arrows.faces.length; i++) {
        var face = arrows.faces[i];
        var m = Matrix.identity();
        for (var j = 0; j < 3; j++) {
            var v = verts[face[j]];
            for (var k = 0; k < 3; k++)
                m.$m[k][j] = v[k];
        }
        m.invert();
        var b = m.transform(pos);
        if (b[0] >= 0 && b[1] >= 0 && b[2] >= 0)
            return [i, Math.sign(m.determinant())];
    }

    return null;
};

Application.prototype.mouse_down = function(event)
{
    if (event.button != 0)
	return;

    var status = document.getElementById("status");

    var rect = this.canvas.getBoundingClientRect();
    var w = rect.right - rect.left;
    var h = rect.bottom - rect.top;
    var sx = 2 / w;
    var sy = 2 / h;
    var x = (event.clientX - rect.left  ) * sx - 1;
    var y = (rect.bottom - event.clientY) * sy - 1;

    var r = this.find_mouse(x, y);
    if (r == null)
        return;
    var face = r[0];
    var det = r[1];

    face = Math.floor(face/2);
    var slice = face % 3;
    face = Math.floor(face/3);
    var y = face % 2;
    face = Math.floor(face/2);
    var x = face % 2;
    face = Math.floor(face/2);
    var axis = face;

    face = axis * 3 + slice;

    //status.textContent = "" + axis + "," + x + "," + y + "," + slice + "," + det;

    return this.start_turn(face, det < 0);
};

Application.prototype.handle_keys = function(t)
{
    var fov = 10.0;

    if (this.key_state["PageDown"])  this.camera_fov -= fov * t;
    if (this.key_state["PageUp"])    this.camera_fov += fov * t;
};

Application.prototype.update = function(t)
{
    this.anim_time = Date.now() / 1e3;

    if (this.anim_update != null) {
	if (!this.anim_update()) {
	    this.anim_finish();
	    this.anim_update = null;
	    this.anim_finish = null;
	}
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

