"use strict";

// ************************************************************

function Application(canvas)
{
    WebGLApp.call(this, canvas);
}

Application.prototype = Object.create(WebGLApp.prototype);

Application.prototype.context_attributes = {preserveDrawingBuffer: true};

Application.prototype.init = function()
{
    this.style = 'fractal';
    this.tex_levels = 10;
    this.level_min = 0;
    this.level_max = 8;
    this.exponent = 0.5;
    this.perlin_level = 4;
    this.wood_offset_x = 0.0;
    this.wood_offset_y = 0.2;
    this.wood_scale_x = 0.1;
    this.wood_scale_y = 0.1;
    this.wood_grainy = 0.15;
    this.wood_stretch = 5.0;
    this.wood_frequency = 500;
    this.distort_scale_x = 0.25;
    this.distort_scale_y = 0.25;
    this.distort_repeat = 8;
    this.shade = 0;
    var k = 0.57735; // 1/sqrt(3)
    this.light = new Float32Array([k, k, k]);
    this.color = new Float32Array([1.0, 0.85, 0.5]);

    this.header = null;
    this.programs = {};
    this.program = null;
    this.tex_rand = null;
    this.tex_target = null;
    this.framebuffer = null;
    this.position_buffer = null;
    this.texcoord_buffer = null;
    this.num_indices = null;
    this.indices_buffer = null;
};

Application.prototype.preprocess = function(name, type, src)
{
    if (this.header && name.startsWith('fshader_'))
        src = this.header + src;
    return src;
};

Application.prototype.setup_programs = function()
{
    var gl = this.ctx;
    gl.getExtension('EXT_shader_texture_lod');
    gl.getExtension('OES_standard_derivatives');
    this.program = this.create_program('vshader', 'fshader');
    this.header = this.load_source('fshader_header');
    this.programs['fractal'] = this.create_program('vshader', 'fshader_fractal');
    this.programs['perlin' ] = this.create_program('vshader', 'fshader_perlin');
    this.programs['wood_g' ] = this.create_program('vshader', 'fshader_grain');
    this.programs['wood_r' ] = this.create_program('vshader', 'fshader_rings');
    this.programs['distort'] = this.create_program('vshader', 'fshader_distort');
    this.check_error();
};

Application.prototype.setup_framebuffer = function()
{
    var gl = this.ctx;

    this.framebuffer = gl.createFramebuffer();
};

Application.prototype.random_texture = function()
{
    var gl = this.ctx;

    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);

    gl.bindTexture(gl.TEXTURE_2D, this.tex_rand);

    for (var level = 0; level <= this.tex_levels; level++) {
        var w = 1<<(this.tex_levels-level);
        var h = w;
        var data = new Uint8Array(w * h * 4);

        var i = 0;
        for (var y = 0; y < h; y++) {
            for (var x = 0; x < w; x++) {
                data[i++] = Math.floor(Math.random()*256);
                data[i++] = Math.floor(Math.random()*256);
                var u = Math.random() * 2 - 1;
                var v = Math.random() * 2 - 1;
                var d = Math.hypot(u, v);
                data[i++] = Math.floor(128+127.99*u/d);
                data[i++] = Math.floor(128+127.99*v/d);
            }
        }

        gl.texSubImage2D(gl.TEXTURE_2D, level, 0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, data);

        this.check_error();
    }
};

Application.prototype.setup_textures = function()
{
    var gl = this.ctx;

    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);

    var tex_rand = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex_rand);

    for (var level = 0; level <= this.tex_levels; level++) {
        var size = 1<<(this.tex_levels-level);
        gl.texImage2D(gl.TEXTURE_2D, level, gl.RGBA, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    }

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

    this.check_error();

    this.tex_rand = tex_rand;

    this.random_texture();

    var tex_target = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex_target);

    var w = 1<<this.tex_levels;
    var h = w;
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

    gl.bindTexture(gl.TEXTURE_2D, null);

    this.tex_target = tex_target;

    this.texture = this.load_texture("image");
};

Application.prototype.setup_buffers = function()
{
    this.position_buffer = this.array_buffer([-1,-1, 1,-1, 1,1, -1,1]);
    this.texcoord_buffer = this.array_buffer([0,0, 1,0, 1,1, 0,1]);

    var indices = [0,1,2, 2,3,0];
    this.indices_buffer  = this.index_buffer(indices);
    this.num_indices = indices.length;

    this.check_error();
};

Application.prototype.setup = function()
{
    this.setup_buffers();
    this.setup_framebuffer();
    this.setup_programs();
    this.setup_textures();
    this.update_program();
    this.update_params();
};

Application.prototype.draw_quad = function(program)
{
    var gl = this.ctx;

    var position_attrib = gl.getAttribLocation(program, "a_Position");
    gl.enableVertexAttribArray(position_attrib);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.position_buffer);
    gl.vertexAttribPointer(position_attrib, 2, gl.FLOAT, false, 0, 0);

    var texcoord_attrib = gl.getAttribLocation(program, "a_TexCoord");
    gl.enableVertexAttribArray(texcoord_attrib);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texcoord_buffer);
    gl.vertexAttribPointer(texcoord_attrib, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indices_buffer);

    gl.drawElements(gl.TRIANGLES, this.num_indices, gl.UNSIGNED_SHORT, 0);

    gl.useProgram(null);
};

Application.prototype.render = function()
{
    var gl = this.ctx;
    var program = this.programs[this.style];
    var tex_size = 1<<this.tex_levels;

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.tex_target, 0);
    gl.viewport(0, 0, tex_size, tex_size);

    gl.useProgram(program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.tex_rand);
    gl.uniform1i(gl.getUniformLocation(program, 'random'), 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.uniform1i(gl.getUniformLocation(program, 'texture'), 1);

    gl.activeTexture(gl.TEXTURE0);

    gl.uniform2i(gl.getUniformLocation(program, 'levels'), this.level_min, this.level_max);
    gl.uniform1f(gl.getUniformLocation(program, 'exponent'), this.exponent);
    gl.uniform1i(gl.getUniformLocation(program, 'shade'), this.shade);

    var size = tex_size >> this.perlin_level
    gl.uniform1i(gl.getUniformLocation(program, 'level'), this.perlin_level);
    gl.uniform2f(gl.getUniformLocation(program, 'size'), size, size);

    var scale_x = this.style == "distort" ? this.distort_scale_x : this.wood_scale_x;
    var scale_y = this.style == "distort" ? this.distort_scale_y : this.wood_scale_y;
    gl.uniform2f(gl.getUniformLocation(program, 'offset'), this.wood_offset_x, this.wood_offset_y);
    gl.uniform2f(gl.getUniformLocation(program, 'scale'), scale_x, scale_y);
    gl.uniform1f(gl.getUniformLocation(program, 'grainy'), this.wood_grainy);
    gl.uniform1f(gl.getUniformLocation(program, 'stretch'), this.wood_stretch);
    gl.uniform1f(gl.getUniformLocation(program, 'frequency'), this.wood_frequency);
    gl.uniform1i(gl.getUniformLocation(program, 'repeat'), this.distort_repeat);

    gl.uniform3fv(gl.getUniformLocation(program, 'light'), this.light);
    gl.uniform3fv(gl.getUniformLocation(program, 'color'), this.color);

    this.draw_quad(program);

    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, null, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);

    gl.bindTexture(gl.TEXTURE_2D, this.tex_target);
    gl.generateMipmap(gl.TEXTURE_2D);

    gl.flush();

    this.check_error();
};

Application.prototype.draw = function()
{
    var gl = this.ctx;
    var tex_size = 1<<this.tex_levels;
    var program = this.program;

    gl.useProgram(program);

    gl.bindTexture(gl.TEXTURE_2D, this.tex_target);

    gl.uniform1i(gl.getUniformLocation(program, 'texture'), 0);

    this.draw_quad(program);

    gl.flush();

    this.check_error();
};

Application.prototype.update_params = function()
{
    document.getElementById("shade").checked = this.shade != 0;

    document.getElementById("level_min"      ).value = this.level_min.toFixed();
    document.getElementById("level_max"      ).value = this.level_max.toFixed();
    document.getElementById("exponent"       ).value = this.exponent.toFixed(3);

    document.getElementById("perlin_level"   ).value = this.perlin_level.toFixed();

    document.getElementById("wood_offset_x"  ).value = this.wood_offset_x.toFixed(3);
    document.getElementById("wood_offset_y"  ).value = this.wood_offset_y.toFixed(3);
    document.getElementById("wood_scale_x"   ).value = this.wood_scale_x.toFixed(3);
    document.getElementById("wood_scale_y"   ).value = this.wood_scale_y.toFixed(3);
    document.getElementById("wood_grainy"    ).value = this.wood_grainy.toFixed(3);
    document.getElementById("wood_stretch"   ).value = this.wood_stretch.toFixed(1);
    document.getElementById("wood_frequency" ).value = this.wood_frequency.toFixed(1);

    document.getElementById("distort_scale_x").value = this.distort_scale_x.toFixed(3);
    document.getElementById("distort_scale_y").value = this.distort_scale_y.toFixed(3);
    document.getElementById("distort_image"  ).value = document.getElementById("image").getAttribute("src");
    document.getElementById("distort_repeat" ).value = this.distort_repeat.toFixed();
};

Application.prototype.redraw = function()
{
    this.render();
    window.requestAnimationFrame(this.draw.bind(this));
};

Application.prototype.change = function(prop, value, isint)
{
    var x = Number(value);
    if (isint)
        x = Math.floor(x);
    this[prop] = x;
    this.redraw();
};

Application.prototype.change_image = function()
{
    var element = document.getElementById("distort_image");
    var url = element.value;
    element = document.getElementById("image");
    element.src = url;
    this.texture = this.load_texture("image");
    this.redraw();
};

Application.prototype.update_program = function()
{
    for (var pgm in this.programs) {
	var element = document.getElementById(pgm);
	element.style.setProperty("background", (pgm == this.style) ? "#00ffff" : "#ffffff");
        var name = pgm.split("_")[0];
        var style = this.style.split("_")[0];
        var div = document.getElementById(name + "_div");
        div.style.setProperty("display", name == style ? "inline" : "none");
    }
};

Application.prototype.set_program = function(id)
{
    this.style = id;
    this.update_program();
    this.redraw();
};

Application.prototype.randomize = function()
{
    this.random_texture();
    this.redraw();
};

// ************************************************************

var app = null;

function init()
{
    canvas = document.getElementById("canvas");
    app = new Application(canvas);
    app.redraw.call(app);
}

