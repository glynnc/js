"use strict";

function WebGLApp(canvas)
{
    this.canvas = canvas;
    this.canvas.setAttribute('tabIndex', 1);
    this.canvas.focus();
    this.ctx = canvas.getContext("webgl", this.context_attributes);

    this.errors = null;
    this.key_state = [];

    this.start_camera_fov = 90;
    this.start_object_rot = [0, 0, 0];
    this.start_object_pos = [0, 0,-2];
    this.start_light_pos  = [1, 1, -1];

    this.init();

    this.camera_fov = this.start_camera_fov;
    this.object_rot = this.start_object_rot.slice();
    this.object_pos = this.start_object_pos.slice();
    this.light_pos  = this.start_light_pos.slice();

    this.setup();

    this.canvas.onkeyup     = this.key_up.bind(this);
    this.canvas.onkeydown   = this.key_down.bind(this);
    this.canvas.onkeypress  = this.key_press.bind(this);

    this.canvas.onmousedown = this.mouse_down.bind(this);
    this.canvas.onmouseup   = this.mouse_up.bind(this);
    this.canvas.onmousemove = this.mouse_move.bind(this);
}

WebGLApp.prototype = new Object;

WebGLApp.prototype.context_attributes = {};

WebGLApp.prototype.check_error = function()
{
    var gl = this.ctx;
    if (this.errors == null) {
	this.errors = {};
	this.errors[gl.INVALID_ENUM] = 'invalid enum';
	this.errors[gl.INVALID_VALUE] = 'invalid value';
	this.errors[gl.INVALID_OPERATION] = 'invalid operation';
	this.errors[gl.OUT_OF_MEMORY] = 'out of memory';
    }

    var code = gl.getError();
    if (code != 0)
	throw Error(this.errors[code]);
};

WebGLApp.prototype.load_resource = function(url, type)
{
    var req = new XMLHttpRequest();
    req.open('GET', url, false);
    if (!type)
        type = 'text/plain; charset=x-user-defined';
    req.overrideMimeType(type);
    req.send(null);
    if (req.status != 200 && req.status != 0)
	return null;
    return req.responseText;
};

WebGLApp.prototype.load_resource_async = function(url, callback, type)
{
    var req = new XMLHttpRequest();
    req.open('GET', url, true);
    if (!type)
        type = 'text/plain; charset=x-user-defined';
    req.overrideMimeType(type);
    req.onload = function (event) {
        if (req.status != 200 && req.status != 0)
            throw Error("error loading resource: " + url);
        else
            callback(req.responseText);
    };
    req.send(null);
    return req;
};

WebGLApp.prototype.load_array_async = function(url, callback)
{
    var req = new XMLHttpRequest();
    req.open('GET', url, true);
    req.responseType = "arraybuffer";
    req.onload = function (event) {
        if (req.status != 200 && req.status != 0)
            throw Error("error loading array: " + url);
        else
            callback(req.response);
    };
    req.send(null);
    return req;
};

WebGLApp.prototype.load_source = function(element_id)
{
    var element = document.getElementById(element_id);
    if (!element)
        throw Error("element '" + element_id + "' not found");

    if (element.hasAttribute("src"))
        return this.load_resource(element.src);
    else
        return element.text;
};

WebGLApp.prototype.load_source_async = function(element_id, callback)
{
    var element = document.getElementById(element_id);
    if (!element)
        throw Error("element '" + element_id + "' not found");

    if (element.hasAttribute("src"))
        this.load_resource_async(element.src, callback);
    else
        callback(element.text);
};

WebGLApp.prototype.preprocess = function(name, type, src)
{
    return src;
};

WebGLApp.prototype.shader = function(name, type, src)
{
    var gl = this.ctx;

    var shader = gl.createShader(type);
    gl.shaderSource(shader, this.preprocess(name, type, src));
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
	throw Error(name + ': ' + gl.getShaderInfoLog(shader));
    return shader;
};

WebGLApp.prototype.make_program = function(vshader, fshader)
{
    var gl = this.ctx;

    var program = gl.createProgram();
    gl.attachShader(program, vshader);
    gl.attachShader(program, fshader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
        throw new Error(gl.getProgramInfoLog(program));

    return program;
};

WebGLApp.prototype.create_program = function(vertex, fragment)
{
    var gl = this.ctx;

    var vertex_src = this.load_source(vertex);
    var fragment_src = this.load_source(fragment);

    var vertex_shader = this.shader(vertex, gl.VERTEX_SHADER, vertex_src);
    var fragment_shader = this.shader(fragment, gl.FRAGMENT_SHADER, fragment_src);

    var program = this.make_program(vertex_shader, fragment_shader);

    this.check_error();

    return program;
};

WebGLApp.prototype.check_shaders = function(state)
{
    if (!state.vertex || !state.fragment)
        return;

    var program = this.make_program(state.vertex, state.fragment);

    this.check_error();
    state.callback(program);
};

WebGLApp.prototype.vertex_source_loaded = function(name, state, text)
{
    var gl = this.ctx;
    state.vertex = this.shader(name, gl.VERTEX_SHADER, text);
    this.check_shaders(state);
};

WebGLApp.prototype.fragment_source_loaded = function(name, state, text)
{
    var gl = this.ctx;
    state.fragment = this.shader(name, gl.FRAGMENT_SHADER, text);
    this.check_shaders(state);
};

WebGLApp.prototype.create_program_async = function(vertex, fragment, callback)
{
    var state = { vertex: null, fragment: null, callback: callback };
    var req_v = this.load_source_async(vertex, this.vertex_source_loaded.bind(this, vertex, state));
    var req_f = this.load_source_async(fragment, this.fragment_source_loaded.bind(this, fragment, state));

    return [req_v, req_f];
};

WebGLApp.prototype.make_texture = function(image, width, height)
{
    var gl = this.ctx;
    var texture = gl.createTexture();
    var from_data = width && height;

    if (!from_data)
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    if (from_data)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, image);
    else
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

    this.check_error();

    return texture;
};

WebGLApp.prototype.load_texture = function(name)
{
    var image = document.getElementById(name);
    return this.make_texture(image);
};

WebGLApp.prototype.make_cubemap = function(names)
{
    var gl = this.ctx;
    var targets = [
	gl.TEXTURE_CUBE_MAP_POSITIVE_X,
	gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
	gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
	gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
	gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
	gl.TEXTURE_CUBE_MAP_NEGATIVE_Z];

    var cubemap = gl.createTexture();

    gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubemap);

    for (var i = 0; i < 6; i++) {
	var name = names[i];
	var target = targets[i];
	var image = document.getElementById(name);
	gl.texImage2D(target, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    }

    gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);

    this.check_error();

    return cubemap;
};

WebGLApp.prototype.flatten = function(a, levels)
{
    if (!levels)
	return a;
    var result = [];
    for (var i = 0; i < a.length; i++) {
	var x = a[i];
	if (levels > 1)
	    x = flatten(x, levels - 1);
	for (var j = 0; j < x.length; j++)
	    result.push(x[j]);
    }
    return result;
};

WebGLApp.prototype.make_array_buffer = function(array)
{
    var gl = this.ctx;
    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, array, gl.STATIC_DRAW);
    return buffer;
};

WebGLApp.prototype.array_buffer = function(data, nest)
{
    var array = new Float32Array(this.flatten(data, nest));
    return this.make_array_buffer(array);
};

WebGLApp.prototype.make_index_buffer = function(array)
{
    var gl = this.ctx;
    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, array, gl.STATIC_DRAW);
    return buffer;
};

WebGLApp.prototype.index_buffer = function(data, nest)
{
    var array = new Uint16Array(this.flatten(data, nest));
    return this.make_index_buffer(array);
};

WebGLApp.prototype.key_press = function(event)
{
    var key = event.key;
    if (key.startsWith("Arrow"))
	key = key.substr(5);

    if (key == "Home") {
	if (event.altKey)
            this.camera_fov = this.start_camera_fov;
        else if (event.ctrlKey)
            this.light_pos = this.start_light_pos.slice();
	else if (event.shiftKey)
            this.object_pos = this.start_object_pos.slice();
        else
            this.object_rot = this.start_object_rot.slice();;
    }

    if (key in ["Up", "Down", "Left", "Right", "PageUp", "PageDown"]) {
	event.stopPropagation();
	event.preventDefault();
    }
};

WebGLApp.prototype.key_down = function(event)
{
    var key = event.key;
    if (key.startsWith("Arrow"))
	key = key.substr(5);

    this.key_state[key] = true;
};

WebGLApp.prototype.key_up = function(event)
{
    var key = event.key;
    if (key.startsWith("Arrow"))
	key = key.substr(5);

    this.key_state[key] = false;
};

WebGLApp.prototype.handle_keys = function(t)
{
    var rot = 45;
    var move = 3.0;
    var fov = 5.0;

    if (this.key_state["Alt"]) {
        if (this.key_state["Down"])      this.camera_fov -= fov * t;
        if (this.key_state["Up"])        this.camera_fov += fov * t;
    }
    else if (this.key_state["Control"]) {
        if (this.key_state["Left"])      this.light_pos[0] -= move * t;
        if (this.key_state["Right"])     this.light_pos[0] += move * t;
        if (this.key_state["Down"])      this.light_pos[1] -= move * t;
        if (this.key_state["Up"])        this.light_pos[1] += move * t;
        if (this.key_state["PageDown"])  this.light_pos[2] -= move * t;
        if (this.key_state["PageUp"])    this.light_pos[2] += move * t;
    }
    else if (this.key_state["Shift"]) {
        if (this.key_state["Left"])      this.object_pos[0] -= move * t;
        if (this.key_state["Right"])     this.object_pos[0] += move * t;
        if (this.key_state["Down"])      this.object_pos[1] -= move * t;
        if (this.key_state["Up"])        this.object_pos[1] += move * t;
        if (this.key_state["PageDown"])  this.object_pos[2] -= move * t;
        if (this.key_state["PageUp"])    this.object_pos[2] += move * t;
    }
    else {
        if (this.key_state["Down"])      this.object_rot[0] -= rot * t;
        if (this.key_state["Up"])        this.object_rot[0] += rot * t;
        if (this.key_state["Right"])     this.object_rot[1] -= rot * t;
        if (this.key_state["Left"])      this.object_rot[1] += rot * t;
        if (this.key_state["PageDown"])  this.object_rot[2] -= rot * t;
        if (this.key_state["PageUp"])    this.object_rot[2] += rot * t;
    }
};

WebGLApp.prototype.mouse_up = function(event)
{
};

WebGLApp.prototype.mouse_down = function(event)
{
};

WebGLApp.prototype.mouse_move = function(event)
{
};

WebGLApp.prototype.init = function()
{
};

WebGLApp.prototype.setup = function()
{
};

WebGLApp.prototype.update = function(t)
{
};

WebGLApp.prototype.draw = function()
{
};

WebGLApp.prototype.refresh = function(t)
{
    var t = 15e-3;
    this.handle_keys(t)
    this.update(t);
    this.draw();
};

