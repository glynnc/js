"use strict";

var funcs = [
    ['zsqr', 2], ['zcub', 2],
    ['zexp', 8], ['zlog', 8],
    ['zsin', 8], ['zcos', 8], ['ztan', 8],
    ['zsec', 8], ['zcsc', 8], ['zcot', 8],
    ['zsinh', 8], ['zcosh', 8], ['ztanh', 8],
    ['zsech', 8], ['zcsch', 8], ['zcoth', 8],
    ['zinv', 8]
    ];

var expressions = [];

var styles = ['sqrt', 'linear', 'bands', '2bands', 'binary', 'angle', 'decomp', 'factor', 'const'];
var e_styles = ['sqrt', 'linear', 'bands', '2bands', 'binary', 'angle', 'decomp', 'const'];
var i_styles = ['const', 'factor', 'angle', 'decomp'];

var header_src;
var complex_src;
var style_src;
var fragment_tmpl;

var mandel_w;
var julia_w;
var orbit_w;

// ************************************************************

function zinv(p)
{
    var a = p[0], b = p[1];
    var k = a*a + b*b;
    return [a/k, -b/k];
}

var errors;

function load_resource(url)
{
    var req = new XMLHttpRequest();
    req.open('GET', url, false);
    req.overrideMimeType('text/plain; charset=x-user-defined');
    req.send(null);
    if (req.status != 200 && req.status != 0) return null;
    return req.responseText;
};

function load_source(element_id)
{
    var element = document.getElementById(element_id);
    if (!element)
        throw Error("element '" + element_id + "' not found");

    if (element.hasAttribute("src"))
        return load_resource(element.src);
    else
        return element.text;
};

function check_error(ctx)
{
    var gl = ctx;

    if (!errors) {
	errors = {};
	errors[gl.INVALID_ENUM] = 'invalid enum';
	errors[gl.INVALID_VALUE] = 'invalid value';
	errors[gl.INVALID_OPERATION] = 'invalid operation';
	errors[gl.OUT_OF_MEMORY] = 'out of memory';
    }
    for (var i = 0; i < 10; i++) {
        var code = gl.getError();
        if (code == 0)
            return;
        throw Error(errors[code]);
    }
};

function make_shader(ctx, name, type, src)
{
    var gl = ctx;
    var shader = gl.createShader(type);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
	throw new Error(name + ": " + gl.getShaderInfoLog(shader));
    return shader;
};

function make_program(ctx, args)
{
    var gl = ctx;
    var program = gl.createProgram();
    for (var i = 0; i < args.length; i++) {
	var shader = args[i];
        gl.attachShader(program, shader);
    }
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
        throw new Error(gl.getProgramInfoLog(program));
    return program;
};

function gl_matrix(m)
{
    return new Float32Array(m.as_array());
};

function format(x)
{
    return (x>=0 ? '+' : '') + x.toExponential(6);
}

// ************************************************************

function Window(id, mandel, element)
{
    element.setAttribute('tabIndex', id+1);

    this.id = id;
    this.mandel = mandel;
    this.element = element;
    this.program = null;
    this.xform = null;
    this.ixform = null;
    this.inverted = false;
    this.buttons = {};

    this.ctx = element.getContext("webgl");
    this.palettes = [];
    this.vertex_shader = null;
    this.position_buffer = null;
    this.texcoord_buffer = null;
    this.index_buffer = null;
}

Window.prototype = new Object;

Window.prototype.reset = function(ev)
{
    this.xform = Matrix.scale(0.5,0.5,0.5);
    this.ixform = null;
    this.update_bounds();
    this.refresh(ev);
};

Window.prototype.scale = function(k, ev)
{
    var k = Math.pow(1.2,k);
    this.xform.premultiply(Matrix.scale(k,k,k));
    this.ixform = null;
    this.update_bounds();
    this.refresh(ev);
};

Window.prototype.move = function(x, y, ev)
{
    this.xform.premultiply(Matrix.translate(x, y, 0));
    this.ixform = null;
    this.update_bounds();
    this.refresh(ev);
};

Window.prototype.center = function(x, y, ev)
{
    this.xform.premultiply(Matrix.translate(x, y, 0));
    this.ixform = null;
    this.update_bounds();
    this.refresh(ev);
};

Window.prototype.rotate = function(a, ev)
{
    this.xform.premultiply(Matrix.rotz(a));
    this.ixform = null;
    this.update_bounds();
    this.refresh(ev);
};

Window.prototype.invert = function(state, ev)
{
    if (state < 0)
	this.inverted = false;
    else if (state > 0)
	this.inverted = true;
    else
	this.inverted = !this.inverted;
    this.refresh(ev);
};

Window.prototype.matrix = function()
{
    return this.xform;
};

Window.prototype.inverse = function()
{
    if (this.ixform == null)
	this.ixform = this.xform.inverse();
    return this.ixform;
};

Window.prototype.update_bounds = function()
{
    var corners = [[-1,-1],[1,-1],[-1,1],[1,1]];
    var text = '';
    var xform = this.inverse();
    for (var i = 0; i < 4; i++) {
        var p = xform.transform(corners[i]);
        var id = "bounds_" + (this.mandel ? "m" : "j") + i;
        var element = document.getElementById(id + "x");
        element.textContent = format(p[0]);
        element = document.getElementById(id + "y");
        element.textContent = format(p[1]);
    }
};

Window.prototype.viewport = function()
{
    return Matrix.viewport(0, 0, this.element.width, this.element.height);
};

Window.prototype.keydown = function(ev)
{
    var k = ev.key;
    var l = k.toLowerCase();
    var shift = ev.shiftKey;

    if (k == '[' || k == '{')
	params.change_maxiter(-1);
    else if (k == ']' || k == '}')
	params.change_maxiter(1);
    else if (k == ',' || k == '<')
	params.change_bailout(-1);
    else if (k == '.' || k == '>')
	params.change_bailout(1);
    else if (k == '#')
	params.change_function(1);
    else if (shift && (k == "ArrowLeft" || k == "Left"))
	this.rotate(-0.1, ev);
    else if (shift && (k == "ArrowRight" || k == "Right"))
	this.rotate(0.1, ev);
    else if (k == "ArrowDown" || k == "Down")
	this.move(0, -0.2, ev);
    else if (k == "ArrowUp" || k == "Up")
	this.move(0, 0.2, ev);
    else if (k == "ArrowLeft" || k == "Left")
	this.move(-0.2, 0, ev);
    else if (k == "ArrowRight" || k == "Right")
	this.move(0.2, 0, ev);
    else if (k == "PageDown")
	this.scale(-1, ev);
    else if (k == "PageUp")
	this.scale( 1, ev);
    else if (k == "Home")
	this.reset(ev);
    else if (l == 'p') {
        if (shift)
	    params.change_palette_in(+1);
        else
	    params.change_palette_ex(+1);
    }
    else if (l == 's') {
        if (shift)
	    params.change_style_in(+1);
        else
	    params.change_style_ex(+1);
        //params.update_program();
    }
    else if (l == 'i')
	this.invert();
    else
	return;

    refresh();
};

Window.prototype.screen2world = function(p)
{
    var mat = this.matrix();
    var view = this.viewport();
    var m = Matrix.multiply(view, mat);
    return m.inverse().transform(p).slice(0,2);
};

Window.prototype.mousedown = function(ev)
{
    var b = ev.button;
    this.buttons[b] = true;
    if (b == 2 || ev.ctrlKey) {
	ev.preventDefault();
	var rect = this.element.getBoundingClientRect();
        var w = rect.right - rect.left;
	var h = rect.bottom - rect.top;
	var x = ev.clientX - rect.left;
	var y = rect.bottom - ev.clientY;
	var c = this.screen2world([w/2, h/2, 0]);
        var p = this.screen2world([x, y, 0]);
        this.center(c[0]-p[0], c[1]-p[1]);
    }
    else if (b == 0) {
        this.mousemove(ev);
    }
    refresh();
};

Window.prototype.mouseup = function(ev)
{
    var b = ev.button;
    this.buttons[b] = false;
};

Window.prototype.mousemove = function(ev)
{
    if (!this.buttons[0])
        return;
    var rect = this.element.getBoundingClientRect();
    var x = ev.clientX - rect.left;
    var y = rect.bottom - ev.clientY;
    var p = this.screen2world([x, y, 0]);
    if (this.inverted)
        p = zinv(p);
    if (this.mandel) {
        params.pos = p;
        params.update_c();
    }
    params.orbit_pos = p;
    params.orbit_mandel = this.mandel;
    orbit_w.update_buffers();

    refresh();
};

Window.prototype.check_error = function()
{
    check_error(this.ctx);
};

Window.prototype.init_buffers = function()
{
    var gl = this.ctx;

    var position = new Float32Array([-1,-1, 1,-1, 1,1, -1,1]);
    this.position_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.position_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, position, gl.STATIC_DRAW);

    var texcoord = new Float32Array([-1,-1, 1,-1, 1,1, -1,1]);
    this.texcoord_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texcoord_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, texcoord, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    this.indices = new Uint16Array([0,1,2, 2,3,0]);
    this.index_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.index_buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    this.check_error();
};

Window.prototype.make_shader = function(name, type, src)
{
    return make_shader(this.ctx, name, type, src);
};

Window.prototype.make_program = function()
{
    return make_program(this.ctx, arguments);
};

Window.prototype.draw = function()
{
    var gl = this.ctx;
    var program = this.program;

    gl.clearColor(0, 0, 1, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.palettes[params.i_palette][1]);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.palettes[params.e_palette][1]);
    gl.activeTexture(gl.TEXTURE0);

    gl.useProgram(program);
    gl.uniform1i(gl.getUniformLocation(program, "mandel"), this.mandel ? 1 : 0);
    gl.uniform1i(gl.getUniformLocation(program, "invert"), this.inverted ? 1 : 0);
    gl.uniform2f(gl.getUniformLocation(program, "pos"), params.pos[0], params.pos[1]);
    //gl.uniform1i(gl.getUniformLocation(program, "maxiter"), params.maxiter);
    gl.uniform1f(gl.getUniformLocation(program, "bailout"), params.bailout);
    gl.uniform1i(gl.getUniformLocation(program, "i_tex"), 0);
    gl.uniform1i(gl.getUniformLocation(program, "e_tex"), 1);
    gl.uniform1i(gl.getUniformLocation(program, "i_style"), params.i_style);
    gl.uniform1i(gl.getUniformLocation(program, "e_style"), params.e_style);
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "matrix"), false, gl_matrix(this.inverse()));

    var position_attrib = gl.getAttribLocation(program, "a_Position");
    gl.enableVertexAttribArray(position_attrib);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.position_buffer);
    gl.vertexAttribPointer(position_attrib, 2, gl.FLOAT, false, 0, 0);

    var texcoord_attrib = gl.getAttribLocation(program, "a_TexCoord");
    gl.enableVertexAttribArray(texcoord_attrib);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texcoord_buffer);
    gl.vertexAttribPointer(texcoord_attrib, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.index_buffer);
    gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    gl.useProgram(null);

    gl.flush();

    this.check_error();
};

Window.prototype.resize = function(event)
{
    var gl = this.ctx;
    gl.viewport(0, 0, this.element.width, this.element.height);
};

Window.prototype.init_palette = function(name, data)
{
    var gl = this.ctx;
    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 256, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array(data));
    this.palettes.push([name,tex]);
};

Window.prototype.init_palettes = function()
{
    function band(lo, hi, count)
    {
	var out = [];
	for (var i = 0; i < count; i++) {
	    for (var j = 0; j < 3; j++) {
		var x = lo[j] + i * (hi[j] - lo[j]) / count;
		out.push(Math.floor(x * 255.999));
	    }
	}
	return out;
    }

    function rainbow()
    {
	var colors = [[0,0,1],[0,1,1],[0,1,0],[1,1,0],[1,0,0],[1,0,1]];
	colors.push(colors[0]);
	var bands = [];
	for (var i = 0; i < 6; i++) {
	    var length = (i % 3 == 0) ? 42 : 43;
	    bands = bands.concat(band(colors[i], colors[i+1], length));
	}
	return bands;
    }

    function rgb()
    {
        var colors = [[0,0,0],[1,0,0],[0,1,0],[0,0,1]];
	var bands = [];
	for (var i = 0; i < 3; i++) {
	    var length = (i == 1) ? 86 : 85;
	    bands = bands.concat(band(colors[0], colors[1+i], length));
	}
        return bands;
    }

    function gray()
    {
        return band([0,0,0], [1,1,1], 256);
    }

    function igray()
    {
        return band([1,1,1], [0,0,0], 256);
    }

    this.init_palette('rainbow', rainbow());
    this.init_palette('rgb', rgb());
    this.init_palette('gray', gray());
    this.init_palette('igray', igray());
};

Window.prototype.init_shaders = function()
{
    var gl = this.ctx;
    this.vertex_shader = this.make_shader('vertex', gl.VERTEX_SHADER, load_source('vertex'));
};

Window.prototype.update_program = function()
{
    var gl = this.ctx;
    var fragment_src = fragment_tmpl
    fragment_src = fragment_src.replace(/EXPRESSION/g, expressions[params.expr]);
    fragment_src = fragment_src.replace(/MAXITER/g, '' + params.maxiter);
    fragment_src = fragment_src.replace(/I_FUNC/g, 's_' + i_styles[params.i_style]);
    fragment_src = fragment_src.replace(/E_FUNC/g, 's_' + e_styles[params.e_style]);
    var source = header_src + fragment_src + complex_src + style_src;
    var fragment_shader = this.make_shader('fragment', gl.FRAGMENT_SHADER, source);
    this.program = this.make_program(this.vertex_shader, fragment_shader);
};

Window.prototype.init = function()
{
    this.reset();
    this.init_shaders();
    this.init_palettes();
    this.init_buffers();
    this.update_program();
    this.resize(null);
    this.element.onkeydown = this.keydown.bind(this);
    this.element.onmousedown = this.mousedown.bind(this);
    this.element.onmouseup = this.mouseup.bind(this);
    this.element.onmousemove = this.mousemove.bind(this);
    this.element.onresize = this.resize.bind(this);
};

Window.prototype.refresh = function(ev)
{
    if (ev)
	ev.preventDefault();
    window.requestAnimationFrame(this.draw.bind(this));
};

// ************************************************************

var Funcs = new Object;

//(a+bi)+(c+di) = (a+c)+(b+d)i
Funcs.zadd = function(a, b)
{
    var re = a[0] + b[0];
    var im = a[1] + b[1];
    return [re, im];
}

//(a+bi)-(c+di) = (a-c)+(b-d)i
Funcs.zsub = function(a, b)
{
    var re = a[0] - b[0];
    var im = a[1] - b[1];
    return [re, im];
}

//(a+bi)(c+di) = (ac-bd)+(ad+bc)i
Funcs.zmul = function(a, b)
{
    var re = a[0] * b[0] - a[1] * b[1];
    var im = a[0] * b[1] + a[1] * b[0];
    return [re, im];
}

//(a+bi)/(c+di) = (ac + bd)/(c^2 + d^2} + (bc - ad)/(c^2 + d^2)i
Funcs.zdiv = function(a, b)
{
    var k = b[0] * b[0] + b[1] * b[1];
    var re = (a[0] * b[0] + a[1] * b[1]) / k;
    var im = (a[1] * b[0] - a[0] * b[1]) / k;
    return [re, im];
}

Funcs.zconj = function(z)
{
    return [z[0], -z[1]]
}

//(a+bi)^2 = (aa-bb) + (2ab)i
Funcs.zsqr = function(z)
{
    var re = z[0] * z[0] - z[1] * z[1];
    var im = 2 * z[0] * z[1];
    return [re, im];
}

//(a+bi)^3 = (aaa-3abb) + (3aab-bbb)i
Funcs.zcub = function(z)
{
    var aa = z[0] * z[0];
    var bb = z[1] * z[1];
    var re = z[0] * (aa - 3*bb);
    var im = z[1] * (3*aa - bb);
    return [re, im];
}

//e^(a+bi) = (e^a)(cos(b) + i.sin(b))
Funcs.zexp = function(z)
{
    var k = Math.exp(z[0]);
    var re = k * Math.cos(z[1]);
    var im = k * Math.sin(z[1]);
    return [re, im];
}

//log(a+bi) = log(a^2 + b^2)/2 + i.arg(a+bi)
Funcs.zlog = function(z)
{
    var re = Math.log(z[0] * z[0] + z[1] * z[1]) / 2;
    var im = Math.atan2(z[1], z[0]);
    return [re, im];
}

//1/(c+di) = c/(c^2 + d^2} - -d/(c^2 + d^2)i
Funcs.zinv = function(z)
{
    var k = z[0] * z[0] + z[1] * z[1];
    return [z[0]/k, -z[1]/k]
}

//sinh(a+bi) = sinh(a) cos(b) + i cosh(a) sin(b)
Funcs.zsinh = function(z)
{
    var re = Math.sinh(z[0]) * Math.cos(z[1]);
    var im = Math.cosh(z[0]) * Math.sin(z[1]);
    return [re, im];
}

//cos(a+bi) = cosh(a) cos(b) + i sinh(a) sin(b)
Funcs.zcosh = function(z)
{
    var re = Math.cosh(z[0]) * Math.cos(z[1]);
    var im = Math.cosh(z[0]) * Math.sin(z[1]);
    return [re, im];
}

//tanh(a+bi) = (sinh(2a) + i.sin(2b)) / (cos(2b) + cosh(2a));
Funcs.ztanh = function(z)
{
    var k = Math.cos(2*z[1]) + Math.cosh(2*z[0]);
    var re = Math.sinh(2*z[0]) / k;
    var im = Math.sin(2*z[1]) / k;
    return [re, im];
}

Funcs.zsec = function(z) { return zinv(zcos(z)); }
Funcs.zcsc = function(z) { return zinv(zsin(z)); }
Funcs.zcot = function(z) { return zinv(ztan(z)); }

Funcs.zsech = function(z) { return zinv(zcosh(z)); }
Funcs.zcsch = function(z) { return zinv(zsinh(z)); }
Funcs.zcoth = function(z) { return zinv(ztanh(z)); }

Funcs.zsqrt = function(z)
{
    var h = Math.hypot(z[0], z[1]);
    var g = Math.sqrt((h + z[0])/2);
    var d = Math.sqrt((h - z[0])/2);
    return [g, z[1] >= 0 ? d : -d];
}

// ************************************************************

function Orbit(element)
{
    element.setAttribute('tabIndex', 3);

    this.element = element;
    this.program = null;
    this.xform = null;
    this.ixform = null;
    this.buttons = {};
    this.maxiter = 256;

    this.ctx = element.getContext("webgl");
    this.vertex_shader = null;
    this.fragment_shader = null;
    this.position_buffer = null;

    this.xform = Matrix.scale(0.5,0.5,0.5);
    this.ixform = Matrix.scale(2, 2, 2);
}

Orbit.prototype = new Object;

Orbit.prototype.check_error = function()
{
    check_error(this.ctx);
};

Orbit.prototype.viewport = function()
{
    return Matrix.viewport(0, 0, this.element.width, this.element.height);
};

Orbit.prototype.init_buffers = function()
{
    var gl = this.ctx;

    this.position_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.position_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.maxiter * 8, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    this.check_error();
};

Orbit.prototype.make_shader = function(name, type, src)
{
    return make_shader(this.ctx, name, type, src);
};

Orbit.prototype.make_program = function()
{
    return make_program(this.ctx, arguments);
};

Orbit.prototype.init_shaders = function()
{
    var gl = this.ctx;
    this.vertex_shader = this.make_shader('vertex', gl.VERTEX_SHADER, load_source('orbit_vertex'));
    this.fragment_shader = this.make_shader('fragment', gl.FRAGMENT_SHADER, load_source('orbit_fragment'));
    this.program = this.make_program(this.vertex_shader, this.fragment_shader);
};

Orbit.prototype.update_program = function()
{
};

Orbit.prototype.update_buffers = function()
{
    var func = Funcs[funcs[params.expr][0]];
    var points = [];
    var z, c;
    if (params.orbit_mandel) {
        z = [0,0];
        c = params.orbit_pos;
    }
    else {
        z = params.orbit_pos;
        c = params.pos;
    }
    for (var i = 0; i < this.maxiter; i++) {
        points.push(z);
        z = Funcs.zadd(func(z), c);
    }
    var data = [];
    for (var i = 0; i < points.length; i++) {
        data.push(points[i][0]);
        data.push(points[i][1]);
    }
    points = null;
    data = new Float32Array(data);

    var gl = this.ctx;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.position_buffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, data);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
};

Orbit.prototype.draw = function()
{
    var gl = this.ctx;
    var program = this.program;

    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "matrix"), false, gl_matrix(this.xform));

    var position_attrib = gl.getAttribLocation(program, "a_Position");
    gl.enableVertexAttribArray(position_attrib);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.position_buffer);
    gl.vertexAttribPointer(position_attrib, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    gl.drawArrays(gl.LINE_STRIP, 0, this.maxiter);

    gl.useProgram(null);

    gl.flush();

    this.check_error();
};

Orbit.prototype.resize = function(event)
{
    var gl = this.ctx;
    gl.viewport(0, 0, this.element.width, this.element.height);
};

Orbit.prototype.init = function()
{
    this.init_shaders();
    this.init_buffers();
    this.resize(null);
    this.element.onresize = this.resize.bind(this);
};

Orbit.prototype.refresh = function(ev)
{
    if (ev)
	ev.preventDefault();
    window.requestAnimationFrame(this.draw.bind(this));
};

// ************************************************************

function Params()
{
    this.windows = [];
    this.pos = [0, 0];
    this.maxiter = 256;
    this.bailout = 2.0;
    this.expr = 0;
    this.i_palette = 0;
    this.e_palette = 0;
    this.i_style = 0;
    this.e_style = 0;
    this.orbit_pos = [0, 0];
    this.orbit_mandel = true;
}

Params.prototype = new Object;

Params.prototype.add_window = function(win)
{
    this.windows.push(win);
};

Params.prototype.update_program = function()
{
    for (var i = 0; i < this.windows.length; i++)
	this.windows[i].update_program();
};

Params.prototype.draw = function()
{
    for (var i = 0; i < this.windows.length; i++)
	this.windows[i].draw();
};

Params.prototype.init = function()
{
    for (var i = 0; i < this.windows.length; i++)
	this.windows[i].init();

    document.getElementById("maxiter").textContent = '' + this.maxiter;
    document.getElementById("bailout").textContent = '' + this.bailout;
    var palettes = this.windows[0].palettes;
    document.getElementById("in_palette").textContent = '' + palettes[this.i_palette][0];
    document.getElementById("ex_palette").textContent = '' + palettes[this.e_palette][0];
    document.getElementById("in_style").textContent = '' + i_styles[this.i_style];
    document.getElementById("ex_style").textContent = '' + e_styles[this.e_style];
    document.getElementById("function").textContent = '' + funcs[this.expr][0].substr(1);
    this.update_c();
};

Params.prototype.change_maxiter = function(dir)
{
    if (dir > 0)
	this.maxiter *= 2;
    else if (dir < 0)
	this.maxiter /= 2;

    if (this.maxiter < 1)
	this.maxiter = 1;
    else if (this.maxiter > 256)
	this.maxiter = 256;

    document.getElementById("maxiter").textContent = '' + this.maxiter;
    this.update_program();
    message('max. iter.: ' + this.maxiter);
    redraw();
};

Params.prototype.change_bailout = function(dir)
{
    if (dir > 0)
	this.bailout *= 2;
    else if (dir < 0)
	this.bailout /= 2;

    document.getElementById("bailout").textContent = '' + this.bailout;
    //this.update_program();
    message('bailout: ' + this.bailout);
    redraw();
};

Params.prototype.change_palette_in = function(dir)
{
    if (dir > 0)
	this.i_palette += 1;
    else if (dir < 0)
	this.i_palette -= 1;

    var palettes = this.windows[0].palettes;
    this.i_palette += palettes.length;
    this.i_palette %= palettes.length;

    document.getElementById("in_palette").textContent = '' + palettes[this.i_palette][0];
    //this.update_program();
    message('int. palette.: ' + palettes[this.i_palette][0]);
    redraw();
};

Params.prototype.change_palette_ex = function(dir)
{
    if (dir > 0)
	this.e_palette += 1;
    else if (dir < 0)
	this.e_palette -= 1;

    var palettes = this.windows[0].palettes;
    this.e_palette += palettes.length;
    this.e_palette %= palettes.length;

    document.getElementById("ex_palette").textContent = '' + palettes[this.e_palette][0];
    //this.update_program();
    message('ext. palette.: ' + palettes[this.e_palette][0]);
    redraw();
};

Params.prototype.change_style_in = function(dir)
{
    if (dir > 0)
	this.i_style += 1;
    else if (dir < 0)
	this.i_style -= 1;

    this.i_style += i_styles.length;
    this.i_style %= i_styles.length;

    document.getElementById("in_style").textContent = '' + i_styles[this.i_style];
    //this.update_program();
    message('int. style.: ' + i_styles[this.i_style]);
    redraw();
};

Params.prototype.change_style_ex = function(dir)
{
    if (dir > 0)
	this.e_style += 1;
    else if (dir < 0)
	this.e_style -= 1;

    this.e_style += e_styles.length;
    this.e_style %= e_styles.length;

    document.getElementById("ex_style").textContent = '' + e_styles[this.e_style];
    //this.update_program();
    message('ext. style.: ' + e_styles[this.e_style]);
    redraw();
};

Params.prototype.change_function = function(dir)
{
    if (dir > 0)
	this.expr += 1;
    else if (dir < 0)
	this.expr -= 1;

    this.expr += expressions.length;
    this.expr %= expressions.length;

    this.bailout = funcs[this.expr][1];

    document.getElementById("function").textContent = '' + funcs[this.expr][0].substr(1);
    document.getElementById("bailout").textContent = '' + this.bailout;
    this.update_program();
    message('function.: ' + expressions[this.expr]);
    redraw();
};

Params.prototype.update_c = function()
{
    document.getElementById("julia_c").textContent = (
        ''
        + format(params.pos[0])
        + ' '
        + format(params.pos[1])
        );
};

var params = new Params();

// ************************************************************

function redraw()
{
    params.draw();
}

function refresh()
{
    window.requestAnimationFrame(redraw);
}

function message(msg)
{
    // alert(msg);
}

// ************************************************************

function init()
{
    for (var i = 0; i < funcs.length; i++)
	expressions.push(funcs[i][0] + '(z) + c');
    fragment_tmpl = load_source('fragment');
    header_src = load_source('header');
    complex_src = load_source('complex');
    style_src = load_source('style');

    mandel_w = new Window(0, true, document.getElementById("mandelbrot"));
    julia_w = new Window(1, false, document.getElementById("julia"));
    orbit_w = new Orbit(document.getElementById("orbit"));

    params.add_window(mandel_w);
    params.add_window(julia_w);
    params.add_window(orbit_w);
    params.init();
    refresh();
}
