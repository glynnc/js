"use strict";

// ************************************************************

function Application(canvas, name)
{
    this.model_name = name;
    WebGLApp.call(this, canvas);
}

Application.prototype = Object.create(WebGLApp.prototype);

Application.prototype.init = function()
{
    this.start_object_pos = [0, -1, -2];

    this.material_emission = [0, 0, 0, 1];
    this.material_ambient = [1, 0.3, 0, 1];
    this.material_diffuse = [1, 0.3, 0, 1];
    this.material_specular  = [1, 1, 1, 1];
    this.material_shininess = 10.0;

    this.light_diffuse = [.6, .6, .6, 1];
    this.light_ambient = [.3, .3, .3, 1];
    this.light_specular  = [1, 1, 1, 1];

    this.model = null;
    this.model_data = null;
    this.animation = null;
    this.xforms = null;
    this.anim = 0;
    this.blends = [0.5, 0.5];
    this.anim_time = null;
    this.submodels = null;

    this.program = null;
    this.texture = null;

    this.position_buffer = null;
    this.normal_buffer = null;
    this.texcoord_buffer = null;
    this.vert_bone_buffer = null;
    this.norm_bone_buffer = null;
    this.indices_buffer = null;
    this.num_indices = null;

    this.is_little_endian = null;
};

Application.prototype.vertex_source_loaded = function(name, state, text)
{
    var gl = this.ctx;
    text = text.replace("@NUM_BONES@", "" + this.model.num_bones);
    state.vertex = this.shader(name, gl.VERTEX_SHADER, text);
    this.check_shaders(state);
};

Application.prototype.create_program = function(vertex, fragment)
{
    var gl = this.ctx;

    var vertex_src = this.load_source(vertex);
    var fragment_src = this.load_source(fragment);
    vertex_src = vertex_src.replace("@NUM_BONES@", "" + this.model.num_bones);

    var fragment_shader = this.shader(fragment, gl.FRAGMENT_SHADER, fragment_src);
    var vertex_shader = this.shader(vertex, gl.VERTEX_SHADER, vertex_src);

    var program = this.make_program(vertex_shader, fragment_shader);

    this.check_error();

    return program;
};

Application.prototype.program_loaded = function(program)
{
    var gl = this.ctx;

    this.program = program;

    this.a_position   = gl.getAttribLocation(this.program, "a_position");
    this.a_normal     = gl.getAttribLocation(this.program, "a_normal");
    this.a_texcoord   = gl.getAttribLocation(this.program, "a_texcoord");
    this.a_vert_bone  = gl.getAttribLocation(this.program, "a_vertex_bone");
    this.a_norm_bone  = gl.getAttribLocation(this.program, "a_normal_bone");

    this.v_mview_mat  = gl.getUniformLocation(this.program, "modelview_matrix");
    this.v_normal_mat = gl.getUniformLocation(this.program, "normal_matrix");
    this.v_proj_mat   = gl.getUniformLocation(this.program, "projection_matrix");
    this.v_bones      = gl.getUniformLocation(this.program, "bones");
    this.v_texture    = gl.getUniformLocation(this.program, "texture");
    this.v_chrome     = gl.getUniformLocation(this.program, "chrome");
    this.v_chrome_box = gl.getUniformLocation(this.program, "chrome_box");
};

Application.prototype.setup_program = function()
{
    this.program = null;
    this.create_program_async('vshader', 'fshader', this.program_loaded.bind(this));
};

Application.prototype.setup_buffers = function()
{
    var gl = this.ctx;

    this.position_buffer  = this.make_array_buffer(this.model.verts);
    this.normal_buffer    = this.make_array_buffer(this.model.norms);
    this.texcoord_buffer  = this.make_array_buffer(this.model.texco);
    this.vert_bone_buffer = this.make_array_buffer(this.model.vert_bones);
    this.norm_bone_buffer = this.make_array_buffer(this.model.norm_bones);

    this.indices_buffer  = this.index_buffer(this.model.faces);
    this.num_indices = this.model.faces.length;

    this.check_error();
};

Application.prototype.setup_texture = function()
{
    this.texture = this.load_texture("texture");
};

Application.prototype.little_endian = function()
{
    if (this.is_little_endian == null) {
        var buffer = new ArrayBuffer(4);
        var u8 = new Uint8Array(buffer);
        var u32 = new Uint32Array(buffer);
        u8.set([0x12,0x34,0x56,0x78]);
        this.is_little_endian = u32[0] == 0x78563412;
    }
    return this.is_little_endian;
};

Application.prototype.getUint16ArrayLE = function(buffer, offset, count)
{
    if (count == undefined)
        count = (buffer.byteLength - offset)/2;
    if (this.little_endian())
        return new Uint16Array(buffer, offset, count);
    var dst = new Uint16Array(count);
    var src = new DataView(buffer, offset, count * 2);
    for (var i = 0; i < count; i++)
        dst[i] = src.getUint16(i * 2, true);
    return dst;
};

Application.prototype.getInt16ArrayLE = function(buffer, offset, count)
{
    if (count == undefined)
        count = (buffer.byteLength - offset)/2;
    if (this.little_endian())
        return new Int16Array(buffer, offset, count);
    var dst = new Int16Array(count);
    var src = new DataView(buffer, offset, count * 2);
    for (var i = 0; i < count; i++)
        dst[i] = src.getInt16(i * 2, true);
    return dst;
};

Application.prototype.getFloat32ArrayLE = function(buffer, offset, count)
{
    if (count == undefined)
        count = (buffer.byteLength - offset)/2;
    if (this.little_endian())
        return new Float32Array(buffer, offset, count);
    var dst = new Float32Array(count);
    var src = new DataView(buffer, offset, count * 4);
    for (var i = 0; i < count; i++)
        dst[i] = src.getFloat32(i * 4, true);
    return dst;
};

Application.prototype.check_loaded = function()
{
    if (!this.model)
        return;

    if (!this.model_data)
        return;

    var model = this.model;
    var data = this.model_data;
    var offsets = this.model.offsets;

    model.verts = this.getFloat32ArrayLE(data, offsets.verts[0], offsets.verts[1] / 4);
    model.norms = this.getFloat32ArrayLE(data, offsets.norms[0], offsets.norms[1] / 4);
    model.texco = this.getFloat32ArrayLE(data, offsets.texco[0], offsets.texco[1] / 4);
    model.vert_bones = new Uint8Array(data, offsets.vbone[0], offsets.vbone[1]);
    model.norm_bones = new Uint8Array(data, offsets.nbone[0], offsets.nbone[1]);
    model.faces = this.getUint16ArrayLE(data, offsets.faces[0], offsets.faces[1] / 2);
    model.value = this.getFloat32ArrayLE(data, offsets.value[0], offsets.value[1] / 4);
    model.scale = this.getFloat32ArrayLE(data, offsets.scale[0], offsets.scale[1] / 4);
    model.parent = new Int8Array(data, offsets.parent[0], offsets.parent[1]);
    model.mbase = this.getUint16ArrayLE(data, offsets.mbase[0], offsets.mbase[1] / 2);
    model.count = this.getUint16ArrayLE(data, offsets.count[0], offsets.count[1] / 2);
    model.flags = new Uint8Array(data, offsets.flags[0], offsets.flags[1]);
    model.skins = new Uint8Array(data, offsets.skins[0], offsets.skins[1]);
    model.aflag = new Uint8Array(data, offsets.aflag[0], offsets.aflag[1]);
    model.ablnd = new Uint8Array(data, offsets.ablnd[0], offsets.ablnd[1]);
    model.afrms = this.getUint16ArrayLE(data, offsets.afrms[0], offsets.afrms[1] / 2);
    model.arate = this.getFloat32ArrayLE(data, offsets.arate[0], offsets.arate[1] / 4);

    var anims   = new Uint8Array(data, offsets.anims[0], offsets.anims[1]);
    model.anims = [];
    var s = "";
    for (var i = 0; i < anims.length; i++) {
        var c = anims[i];
        if (!c) {
            model.anims.push(s);
            s = "";
        }
        else
            s += String.fromCharCode(c);
    }

    this.setup_blends();
    this.setup_animations();
    this.setup_buffers();
    this.load_animation();
};

Application.prototype.model_data_loaded = function(data)
{
    this.model_data = data;
    this.check_loaded();
};

Application.prototype.model_loaded = function(text)
{
    this.model = eval("(" + text + ")");
    this.model.num_bones = this.model.offsets.parent[1];

    this.setup_program();
    this.setup_submodels();

    this.check_loaded();
};

Application.prototype.load_model = function()
{
    this.model = null;
    this.model_data = null;
    this.load_resource_async(this.model_name + ".js", this.model_loaded.bind(this));
    this.load_array_async(this.model_name + ".dat", this.model_data_loaded.bind(this));
};

Application.prototype.change_blend = function(index, event)
{
    var elem = event.target;
    var min = elem.min == "" ?   0 : Number(elem.min);
    var max = elem.max == "" ? 100 : Number(elem.max);
    var value = elem.value;
    value = Math.min(max, value);
    value = Math.max(min, value);
    var k = (value - min) / (max - min);
    this.blends[index] = k;
};

Application.prototype.setup_blends = function()
{
    for (var i = 0; i < 2; i++) {
        var elem = document.getElementById("blend" + i);
        elem.min = 0;
        elem.max = 100;
        elem.value = 50;
        elem.oninput = this.change_blend.bind(this, i);
    }
};

Application.prototype.setup_animations = function()
{
    var elem = document.getElementById("animations");
    for (var i = 0; i < this.model.anims.length; i++) {
	var name = this.model.anims[i];
	var node = document.createElement("a");
	node.id = "anim_" + name;
	node.href = "javascript:app.set_animation(" + i + ")";
	node.textContent = name;
	elem.appendChild(node);
        var blends = this.model.ablnd[i];
        if (blends != 1)
            elem.appendChild(document.createTextNode(" (" + blends + ")"));
	elem.appendChild(document.createElement("br"));
    }
};

Application.prototype.setup_submodels = function()
{
    if (!this.model.body_parts)
        return;

    this.submodels = [];

    var elem = document.getElementById("parts");
    for (var i = 0; i < this.model.body_parts.length; i++) {
	var bp = this.model.body_parts[i];
	elem.appendChild(document.createTextNode(bp.name + ":"));
	elem.appendChild(document.createElement("br"));
        this.submodels.push(0);
        for (var j = 0; j < bp.submodels.length; j++) {
            var sm = bp.submodels[j];
            elem.appendChild(document.createTextNode(" - "));
            var node = document.createElement("a");
            node.id = "part_" + bp.name + "_" + sm.name;
            node.href = "javascript:app.set_submodel(" + i + ", " + j + ")";
            node.textContent = sm.name;
            elem.appendChild(node);
            elem.appendChild(document.createElement("br"));
        }
    }
};

Application.prototype.setup = function()
{
    this.load_model();
    this.setup_texture();
};

Application.prototype.draw = function()
{
    var gl = this.ctx;

    gl.clearColor(0.5, 0.5, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    if (!this.program)
        return;
    if (!this.model || !this.model_data)
        return;
    if (!this.animation)
        return;
    
    var modelview_mat = new Matrix();
    modelview_mat.postmultiply(Matrix.translate(this.object_pos));
    modelview_mat.postmultiply(Matrix.rotx(this.object_rot[0], true));
    modelview_mat.postmultiply(Matrix.roty(this.object_rot[1], true));
    modelview_mat.postmultiply(Matrix.rotz(this.object_rot[2], true));
    modelview_mat.postmultiply(new Matrix([0,1,0,0, 0,0,1,0, 1,0,0,0, 0,0,0,1])); // x,y,z -> y,z,x
    var m = modelview_mat.as_array();
    var normal_mat = [m[0],m[1],m[2],m[4],m[5],m[6],m[8],m[9],m[10]];
    modelview_mat.postmultiply(Matrix.scale(0.03, 0.03, 0.03));

    var projection_mat = Matrix.perspective(this.camera_fov, this.canvas.height / this.canvas.width, 0.1, 10.0);

    var bones_array = [];
    for (var i = 0; i < this.xforms.length; i++) {
	var a = this.xforms[i].as_array();
	for (var j = 0; j < a.length; j++)
	    bones_array.push(a[j]);
    }

    gl.enable(gl.DEPTH_TEST);

    gl.useProgram(this.program);

    gl.uniformMatrix4fv(this.v_mview_mat,  false, new Float32Array(modelview_mat.as_array()));
    gl.uniformMatrix3fv(this.v_normal_mat, false, new Float32Array(normal_mat));
    gl.uniformMatrix4fv(this.v_proj_mat,   false, new Float32Array(projection_mat.as_array()));
    gl.uniformMatrix4fv(this.v_bones,      false, new Float32Array(bones_array));
    gl.uniform1i(this.v_texture, 0);
    if (this.model.chrome)
        gl.uniform4fv(this.v_chrome_box, new Float32Array(this.model.chrome));
    
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.texture);

    gl.enableVertexAttribArray(this.a_position);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.position_buffer);
    gl.vertexAttribPointer(this.a_position, 3, gl.FLOAT, false, 0, 0);

    gl.enableVertexAttribArray(this.a_texcoord);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texcoord_buffer);
    gl.vertexAttribPointer(this.a_texcoord, 2, gl.FLOAT, true, 0, 0);

    gl.enableVertexAttribArray(this.a_normal);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.normal_buffer);
    gl.vertexAttribPointer(this.a_normal, 3, gl.FLOAT, true, 0, 0);

    gl.enableVertexAttribArray(this.a_vert_bone);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vert_bone_buffer);
    gl.vertexAttribPointer(this.a_vert_bone, 1, gl.UNSIGNED_BYTE, false, 0, 0);

    gl.enableVertexAttribArray(this.a_norm_bone);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.norm_bone_buffer);
    gl.vertexAttribPointer(this.a_norm_bone, 1, gl.UNSIGNED_BYTE, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indices_buffer);

    if (this.model.body_parts) {
        for (var i_bp = 0; i_bp < this.model.body_parts.length; i_bp++) {
            var bp = this.model.body_parts[i_bp];
            var i_sm = this.submodels[i_bp];
            var sm = bp.submodels[i_sm];
            for (var i_m = 0; i_m < sm.meshes[1]; i_m++) {
                var m = sm.meshes[0] + i_m;
                gl.uniform1i(this.v_chrome, this.model.flags[m]);
                gl.drawElements(gl.TRIANGLES, this.model.count[m], gl.UNSIGNED_SHORT, this.model.mbase[m] * 2);
            }
        }
    }
    else
        gl.drawElements(gl.TRIANGLES, this.num_indices, gl.UNSIGNED_SHORT, 0);

    gl.useProgram(null);

    gl.flush();

    this.check_error();
};

Application.prototype.calc_bone_position = function(sd, bone, track, frame, k)
{
    var v0 = [0, 0, 0];
    var v1 = [0, 0, 0];
    for (var i = 0; i < 3; i++) {
        var offset = track[i];
	if (offset >= 0) {
	    v0[i] = this.animation.data[offset + frame];
	    v1[i] = this.animation.data[offset + (frame + 1) % sd.num_frames];
	}
    }

    var value = this.model.value.subarray(bone * 6, bone * 6 + 3);
    var scale = this.model.scale.subarray(bone * 6, bone * 6 + 3);

    v0 = vector_add(value, vector_mul(scale, v0));
    v1 = vector_add(value, vector_mul(scale, v1));

    return vector_interpolate(v0, v1, k);
};

Application.prototype.calc_bone_rotation = function(sd, bone, track, frame, k)
{
    var a0 = [0, 0, 0];
    var a1 = [0, 0, 0];
    for (var i = 0; i < 3; i++) {
        var offset = track[i+3];
	if (offset >= 0) {
	    a0[i] = this.animation.data[offset + frame]
	    a1[i] = this.animation.data[offset + (frame + 1) % sd.num_frames];
	}
    }

    var value = this.model.value.subarray(bone * 6 + 3, bone * 6 + 6);
    var scale = this.model.scale.subarray(bone * 6 + 3, bone * 6 + 6);

    a0 = vector_add(value, vector_mul(scale, a0));
    a1 = vector_add(value, vector_mul(scale, a1));

    var all = true;
    for (i = 0; i < 3; i++)
	if (Math.abs(a0[i] - a1[i]) >  0.001)
	    all = false;
    if (all)
	return angle_quaternion(a0);

    var q0 = angle_quaternion(a0);
    var q1 = angle_quaternion(a1);

    return quaternion_slerp(q0, q1, k);
};

Application.prototype.calc_bone_1 = function(sd, blend, bone, frame, k)
{
    var start = this.model.num_bones * blend + bone;
    var track = this.animation.offset.subarray(start * 6, start * 6 + 6);
    var p = this.calc_bone_position(sd, bone, track, frame, k);
    var q = this.calc_bone_rotation(sd, bone, track, frame, k);
    return [p, q];
};

Application.prototype.do_blend = function(pq0, pq1, k)
{
    var p = vector_interpolate(pq0[0], pq1[0], k);
    var q = quaternion_slerp(pq0[1], pq1[1], k);
    return [p, q];
};

Application.prototype.calc_bone = function(sd, bone, frame, k)
{
    if (sd.num_blends == 1)
        return this.calc_bone_1(sd, 0, bone, frame, k);
    else if (sd.num_blends == 2) {
        var pq0 = this.calc_bone_1(sd, 0, bone, frame, k);
        var pq1 = this.calc_bone_1(sd, 1, bone, frame, k);
        return this.do_blend(pq0, pq1, this.blends[0]);
    }
    else if (sd.num_blends == 4) {
        var pq0 = this.calc_bone_1(sd, 0, bone, frame, k);
        var pq1 = this.calc_bone_1(sd, 1, bone, frame, k);
        var pq2 = this.calc_bone_1(sd, 2, bone, frame, k);
        var pq3 = this.calc_bone_1(sd, 3, bone, frame, k);
        var pq01 = this.do_blend(pq0, pq1, this.blends[0]);
        var pq23 = this.do_blend(pq2, pq3, this.blends[0]);
        return this.do_blend(pq01, pq23, this.blends[1]);
    }
    else
        throw Error("invalid number of blends: " + sd.num_blends);
};

Application.prototype.setup_bones = function()
{
    if (!this.animation)
        return;

    var sd = this.animation;
    var num_frames = sd.num_frames - ((sd.flags & 1) ? 0 : 1);
    var frame = Math.floor(this.anim_time * sd.fps) % num_frames;
    var k = (this.anim_time * sd.fps) % 1.0;

    if (frame < 0) {
	frame += sd.num_frames;
	frame %= sd.num_frames;
	k += 1;
    }

    this.xforms = [];

    for (var i = 0; i < this.model.num_bones; i++) {
	var parent = this.model.parent[i];
	var pq = this.calc_bone(sd, i, frame, k);
	var p = pq[0];
	var q = pq[1];

	var x = Matrix.translate(p).postmultiplied(quaternion_matrix(q));
	if (parent >= 0)
	    x.premultiply(this.xforms[parent]);
	this.xforms.push(x);
    }
};

Application.prototype.update = function(t)
{
    this.anim_time = Date.now() / 1e3;
    this.setup_bones();
};

Application.prototype.animation_loaded = function(data)
{
    var anim = {};

    anim.num_frames = this.model.afrms[this.anim];
    anim.num_blends = this.model.ablnd[this.anim];
    anim.fps = this.model.arate[this.anim];
    anim.flags = this.model.aflag[this.anim];
    var count = this.model.num_bones * anim.num_blends;
    anim.offset = this.getInt16ArrayLE(data, 0, count * 6);
    anim.data = this.getInt16ArrayLE(data, count * 6 * 2);

    this.animation = anim;
};

Application.prototype.load_animation = function()
{
    this.animation = null;

    var name = this.model.anims[this.anim];
    var datname = "anims/" + "anim_" + name + ".dat";
    this.load_array_async(datname, this.animation_loaded.bind(this));

    for (var i = 0; i < this.model.anims.length; i++) {
	var name = this.model.anims[i];
	var link = document.getElementById("anim_" + name);
	link.style.setProperty("background", (i == this.anim) ? "#00ffff" : "#ffffff");
    }
};

Application.prototype.set_animation = function(id)
{
    if (id < 0 || id >= this.model.anims.length)
	return;
    this.anim = id;
    this.load_animation();
};

Application.prototype.change_animation = function(dir)
{
    this.anim += dir;
    this.anim += this.model.anims.length;
    this.anim %= this.model.anims.length;
    this.load_animation();
};

Application.prototype.set_submodel = function(part, sub)
{
    if (!this.model.body_parts)
        return;

    if (part < 0 || part >= this.model.body_parts.length)
	return;

    var bp = this.model.body_parts[part];

    if (sub < 0 || sub >= bp.submodels.length)
	return;

    this.submodels[part] = sub;
};

// ************************************************************

var app = null;

function init(name)
{
    var canvas = document.getElementById("canvas");
    app = new Application(canvas, name);
    setInterval(app.refresh.bind(app), 20);
}

// ************************************************************

