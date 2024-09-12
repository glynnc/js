"use strict";

// ************************************************************

function Application(canvas)
{
    WebGLApp.call(this, canvas);
}

Application.prototype = Object.create(WebGLApp.prototype);

Application.prototype.init = function()
{
    this.nmaps = [["noise",2],["floor",4],["bumps",8],["scale",32],["tiles",16]];

    this.material_emission = [0, 0, 0, 1];
    this.material_ambient = [1, 0.3, 0, 1];
    this.material_diffuse = [1, 0.3, 0, 1];
    this.material_specular  = [1, 1, 1, 1];
    this.material_shininess = 10.0;

    this.light_diffuse = [.6, .6, .6, 1];
    this.light_ambient = [.3, .3, .3, 1];
    this.light_specular  = [1, 1, 1, 1];

    this.do_env = false;
    this.program = null;
    this.shapes = [];
    this.shape = 0;
    this.textures = [];
    this.texture = 0;
    this.normal_maps = [];
    this.normal_map = 0;
    this.env_maps = [];
    this.env_map = 0;
    this.colors = [[1, 1, 1, 1], [1, 0.3, 0.3, 1], [0.3, 1, 0.3, 1], [0.3, 0.3, 1, 1]];
    this.color = 0;
    this.gamma = 2.2;

    this.position_buffer = null;
    this.normal_buffer = null;
    this.tangent_buffer = null;
    this.texcoord_buffer = null;
    this.indices_buffer = null;
    this.num_indices = null;
};

Application.prototype.setup_program = function()
{
    this.program = this.create_program('vshader', 'fshader');
};

Application.prototype.torus = function(r0, r1, n0, n1)
{
    var k0 = [], c0 = [], s0 = [];
    for (var i = 0; i <= n0; i++) {
	var k = i / n0;
	var a = k * 2 * Math.PI;
	k0.push(k);
	s0.push(Math.sin(a));
	c0.push(Math.cos(a));
    }

    var k1 = [], c1 = [], s1 = [];
    for (var j = 0; j <= n1; j++) {
	var k = j / n1;
	var a = k * 2 * Math.PI;
	k1.push(k);
	s1.push(Math.sin(a));
	c1.push(Math.cos(a));
    }

    var position = [];
    var normal = [];
    var texcoord = [];
    var tangent = [];
    for (var i = 0; i <= n0; i++) {
	for (var j = 0; j <= n1; j++) {
	    var tx = k0[i];
	    var ty = k1[j];
	    texcoord.push(tx);
	    texcoord.push(ty);

	    var cx = r1 * s1[j];
	    var cy = r1 * c1[j];
	    var cz = 0;

	    var nx = s0[i] * s1[j];
	    var ny = s0[i] * c1[j];
	    var nz = c0[i];
	    normal.push(nx);
	    normal.push(ny);
	    normal.push(nz);

	    var ux = c0[i] * s1[j];
	    var uy = c0[i] * c1[j];
	    var uz = -s0[i];
	    tangent.push(ux);
	    tangent.push(uy);
	    tangent.push(uz);

	    var px = cx + r0 * nx;
	    var py = cy + r0 * ny;
	    var pz = cz + r0 * nz;
	    position.push(px);
	    position.push(py);
	    position.push(pz);
	}
    }

    var indices = [];
    for (var i = 0; i < n0; i++) {
	var i0 = (i+0) * (n1+1);
	var i1 = (i+1) * (n1+1);
	for (var j = 0; j < n1; j++) {
	    var i00 = i0 + (j+0);
	    var i01 = i0 + (j+1);
	    var i10 = i1 + (j+0);
	    var i11 = i1 + (j+1);
	    indices.push(i00);
	    indices.push(i01);
	    indices.push(i11);
	    indices.push(i11);
	    indices.push(i10);
	    indices.push(i00);
	}
    }

    return {
	'position': position,
	'normal': normal,
	'texcoord': texcoord,
	'tangent': tangent,
        'indices': indices
	};
};

Application.prototype.cube = function(size)
{
    var vertices = [];
    var normals = [];
    var texcoords = [];
    var tangents = [];
    var indices = [];

    var perms = [[0,1,2], [2,0,1], [1,2,0]];
    for (var dir = 0; dir < 3; dir++) {
	var perm = perms[dir];
	var axis_u = perm[0], axis_v = perm[1], axis_w = perm[2];
	for (var w = 0; w < 2; w++) {
	    var t = [0, 0, 0];
	    t[axis_u] = 2*w-1;
	    var n = [0, 0, 0];
	    n[axis_w] = 2*w-1;
	    for (var u = 0; u < 2; u++) {
		for (var v = 0; v < 2; v++) {
		    var p = [0, 0, 0];
		    p[axis_u] = size * (2*u-1);
		    p[axis_v] = size * (2*v-1) * (2*w-1);
		    p[axis_w] = size * (2*w-1);
		    vertices.push(p[0]);
		    vertices.push(p[1]);
		    vertices.push(p[2]);
		    normals.push(n[0]);
		    normals.push(n[1]);
		    normals.push(n[2]);
		    tangents.push(t[0]);
		    tangents.push(t[1]);
		    tangents.push(t[2]);
		    texcoords.push(u);
		    texcoords.push(v);
		}
	    }
	    var i = (2*dir+w)*4;
	    var i0 = i + 0;
	    var i1 = i + 2;
	    var i00 = i0 + 0;
	    var i01 = i0 + 1;
	    var i10 = i1 + 0;
	    var i11 = i1 + 1;
	    indices.push(i00);
	    indices.push(i01);
	    indices.push(i11);
	    indices.push(i11);
	    indices.push(i10);
	    indices.push(i00);
	}
    }

    return {
	'position': vertices,
	'normal': normals,
	'texcoord': texcoords,
	'tangent': tangents,
        'indices': indices
	};
};

Application.prototype.setup_tangents = function(verts, texco, norms, faces)
{
    var edges = [];
    for (var i = 0; i < faces.length; i += 3) {
	var i0 = faces[i+0];
	var i1 = faces[i+1];
	var i2 = faces[i+2];
	edges[i0] = [i1,i2];
	edges[i1] = [i2,i0];
	edges[i2] = [i0,i1];
    }

    var tangents = [];

    for (var i = 0; i < verts.length / 3; i++) {
	var vx = verts[i*3+0], vy = verts[i*3+1], vz = verts[i*3+2];
	var tu = texco[i*2+0], tv = texco[i*2+1];
	var i1 = edges[i][0];
	var i2 = edges[i][1];
	var v1x = verts[i1*3+0] - vx, v1y = verts[i1*3+1] - vy, v1z = verts[i1*3+2] - vz;
	var v2x = verts[i2*3+0] - vx, v2y = verts[i2*3+1] - vy, v2z = verts[i2*3+2] - vz;
	var t1u = texco[i1*2+0] - tu, t1v = texco[i1*2+1] - tv;
	var t2u = texco[i2*2+0] - tu, t2v = texco[i2*2+1] - tv;
	var d = t1u * t2v - t2u * t1v;
        // var m = [[(t2v*v1x-t1v*v2x)/d,(t1u*v2x-t2u*v1x)/d],
	// 	 [(t2v*v1y-t1v*v2y)/d,(t1u*v2y-t2u*v1y)/d],
	// 	 [(t2v*v1z-t1v*v2z)/d,(t1u*v2z-t2u*v1z)/d]];
        var btx = (t1u*v2x - t2u*v1x)/d, bty = (t1u*v2y - t2u*v1y)/d, btz = (t1u*v2z - t2u*v1z)/d;
	var nx = norms[i*3+0], ny = norms[i*3+1], nz = norms[i*3+2];
	var tx = btz*ny - bty*nz, ty = btx*nz - btz*nx, tz = bty*nx - btx*ny;
	var l = Math.sqrt(tx*tx + ty*ty + tz * tz);

	tangents.push(tx/l);
	tangents.push(ty/l);
	tangents.push(tz/l);
    }

    return tangents;
};

Application.prototype.monkey = function()
{
    var tangents = this.setup_tangents(monkey_verts, monkey_texco, monkey_norms, monkey_faces);

    return {
	'position': monkey_verts,
	'texcoord': monkey_texco,
	'normal': monkey_norms,
	'tangent': tangents,
	'indices': monkey_faces
    };
};

Application.prototype.setup_buffers = function(obj)
{
    var gl = this.ctx;

    this.position_buffer = this.array_buffer(obj.position);
    this.texcoord_buffer = this.array_buffer(obj.texcoord);
    this.normal_buffer   = this.array_buffer(obj.normal);
    this.tangent_buffer  = this.array_buffer(obj.tangent);

    this.indices_buffer  = this.index_buffer(obj.indices);
    this.num_indices = obj.indices.length;

    this.check_error();
};

Application.prototype.setup_textures = function()
{
    for (var i = 0; i < this.nmaps.length; i++) {
	var name = this.nmaps[i][0];
	var scale = this.nmaps[i][1];
	var image = document.getElementById("nmap_" + name);
	this.normal_maps.push([this.make_texture(image), scale]);
    }

    for (var i = 1; i <= 3; i++) {
	var image = document.getElementById("texture" + i);
	this.textures.push(this.make_texture(image));
    }

    for (var i = 1; i <= 1; i++) {
	var image = document.getElementById("envmap" + i);
	this.env_maps.push(this.make_texture(image));
    }
};

Application.prototype.setup = function()
{
    var torus  = function(){return this.torus(0.3, 1.0, 16, 32)};
    var cube   = function(){return this.cube(0.7)};
    var monkey = function(){return this.monkey()};
    this.shapes = [
	[torus.bind(this), [1,2]],
	[cube.bind(this), [1,1]],
	[monkey.bind(this), [2,2]]
	];
    this.setup_program();
    this.setup_textures();
    this.setup_buffers(this.shapes[this.shape][0]());
};

Application.prototype.set_uniform = function(variable, func, type, value)
{
    var gl = this.ctx;
    var loc = gl.getUniformLocation(this.program, variable);

    if (type == 0)
	func.call(gl, loc, value);
    else if (type == 1)
	func.call(gl, loc, new Float32Array(value));
    else if (type == 2)
	func.call(gl, loc, false, new Float32Array(value));
    else
	throw new Error('invalid type');
};

Application.prototype.draw = function()
{
    var gl = this.ctx;
    var tex_scale = this.shapes[this.shape][1];
    this.material_ambient = this.colors[this.color];
    this.material_diffuse = this.colors[this.color];

    gl.clearColor(0.5, 0.5, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var modelview_mat = new Matrix();
    modelview_mat.postmultiply(Matrix.translate(this.object_pos));
    modelview_mat.postmultiply(Matrix.rotx(this.object_rot[0], true));
    modelview_mat.postmultiply(Matrix.roty(this.object_rot[1], true));
    modelview_mat.postmultiply(Matrix.rotz(this.object_rot[2], true));
    var m = modelview_mat.as_array();
    var normal_mat = [m[0],m[1],m[2],m[4],m[5],m[6],m[8],m[9],m[10]];
    
    var projection_mat = Matrix.perspective(this.camera_fov, this.canvas.height / this.canvas.width, 0.1, 10.0);

    gl.enable(gl.DEPTH_TEST);

    gl.useProgram(this.program);

    this.set_uniform('modelview_matrix',   gl.uniformMatrix4fv, 2, modelview_mat.as_array());
    this.set_uniform('projection_matrix',  gl.uniformMatrix4fv, 2, projection_mat.as_array());
    this.set_uniform('normal_matrix',      gl.uniformMatrix3fv, 2, normal_mat);

    this.set_uniform('texture',            gl.uniform1i,  0, 0);
    this.set_uniform('normal_map',         gl.uniform1i,  0, 1);
    this.set_uniform('env_map',            gl.uniform1i,  0, 2);
    this.set_uniform('env',                gl.uniform1i,  0, this.do_env);
    this.set_uniform('nmap_scale',         gl.uniform1f,  0, this.normal_maps[this.normal_map][1]);
    this.set_uniform('tex_scale',          gl.uniform2fv, 1, tex_scale);
    this.set_uniform('gamma',              gl.uniform1f,  0, this.gamma);

    this.set_uniform('light_position',     gl.uniform3fv, 1, this.light_pos);
    this.set_uniform('light_ambient',      gl.uniform4fv, 1, this.light_ambient);
    this.set_uniform('light_diffuse',      gl.uniform4fv, 1, this.light_diffuse);
    this.set_uniform('light_specular',     gl.uniform4fv, 1, this.light_specular);

    this.set_uniform('material_emission',  gl.uniform4fv, 1, this.material_emission);
    this.set_uniform('material_ambient',   gl.uniform4fv, 1, this.material_ambient);
    this.set_uniform('material_diffuse',   gl.uniform4fv, 1, this.material_diffuse);
    this.set_uniform('material_specular',  gl.uniform4fv, 1, this.material_specular);
    this.set_uniform('material_shininess', gl.uniform1f,  0, this.material_shininess);

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.textures[this.texture]);
    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, this.normal_maps[this.normal_map][0]);
    gl.activeTexture(gl.TEXTURE2)
    gl.bindTexture(gl.TEXTURE_2D, this.env_maps[this.env_map]);

    var position_attrib = gl.getAttribLocation(this.program, "a_Position");
    var texcoord_attrib = gl.getAttribLocation(this.program, "a_TexCoord");
    var normal_attrib   = gl.getAttribLocation(this.program, "a_Normal");
    var tangent_attrib  = gl.getAttribLocation(this.program, "a_Tangent");

    gl.enableVertexAttribArray(position_attrib);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.position_buffer);
    gl.vertexAttribPointer(position_attrib, 3, gl.FLOAT, false, 0, 0);

    gl.enableVertexAttribArray(texcoord_attrib);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texcoord_buffer);
    gl.vertexAttribPointer(texcoord_attrib, 2, gl.FLOAT, true, 0, 0);

    gl.enableVertexAttribArray(normal_attrib);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.normal_buffer);
    gl.vertexAttribPointer(normal_attrib, 3, gl.FLOAT, true, 0, 0);

    gl.enableVertexAttribArray(tangent_attrib);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.tangent_buffer);
    gl.vertexAttribPointer(tangent_attrib, 3, gl.FLOAT, true, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indices_buffer);

    gl.drawElements(gl.TRIANGLES, this.num_indices, gl.UNSIGNED_SHORT, 0);

    gl.useProgram(null);

    gl.flush();

    this.check_error();
};

// ************************************************************

Application.prototype.toggle_envmap = function()
{
    this.do_env = !this.do_env;
};

Application.prototype.change_env_map = function(dir)
{
    this.env_map += dir;
    this.env_map += this.env_maps.length;
    this.env_map %= this.env_maps.length;
};

Application.prototype.change_normal_map = function(dir)
{
    this.normal_map += dir;
    this.normal_map += this.normal_maps.length;
    this.normal_map %= this.normal_maps.length;
};

Application.prototype.change_texture = function(dir)
{
    this.texture += dir;
    this.texture += this.textures.length;
    this.texture %= this.textures.length;
};

Application.prototype.change_color = function(dir)
{
    this.color += dir;
    this.color += this.colors.length;
    this.color %= this.colors.length;
};

Application.prototype.change_shape = function(dir)
{
    this.shape += dir;
    this.shape += this.shapes.length;
    this.shape %= this.shapes.length;
    this.setup_buffers(this.shapes[this.shape][0]());
};

Application.prototype.change_gamma = function(amount)
{
    this.gamma += amount;
    if (this.gamma < 1.0)
	this.gamma = 1.0;
    if (this.gamma > 5.0)
	this.gamma = 5.0;
};

// ************************************************************

Application.prototype.key_press = function(event)
{
    WebGLApp.prototype.key_press.call(this, event);

    var key = event.key.toLowerCase();

    if (key == 'm') {
	this.toggle_envmap();
    }
    else if (key == 'e') {
	this.change_env_map(1);
    }
    else if (key == 'n') {
	this.change_normal_map(1);
    }
    else if (key == 't') {
	this.change_texture(1);
    }
    else if (key == 'c') {
	this.change_color(1);
    }
    else if (key == 's') {
	this.change_shape(1);
    }
    else if (key == '[') {
	this.change_gamma(-0.1);
    }
    else if (key == ']') {
	this.change_gamma( 0.1);
    }
};

Application.prototype.rotate_x = function(dir)
{
    this.object_rot[0] += dir * rotate_speed;
};

Application.prototype.rotate_y = function(dir)
{
    this.object_rot[1] += dir * rotate_speed;
};

Application.prototype.move_z = function(dir)
{
    this.object_pos[2] += dir * move_speed;
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

