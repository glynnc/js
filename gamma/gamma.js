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

    this.v_random = null;

    this.a_position = null;
    this.a_texcoord = null;

    this.position_buffer = null;
    this.texcoord_buffer = null;

    this.steps = 15;
    this.g_min = 1.5;
    this.g_max = 3.0;

    this.random = null;
};

Application.prototype.dither = new Uint8Array([
    255, 127, 223,  95, 247, 119, 215,  87, 253, 125, 221,  93, 245, 117, 213,  85,
     63, 191,  31, 159,  55, 183,  23, 151,  61, 189,  29, 157,  53, 181,  21, 149,
    207,  79, 239, 111, 199,  71, 231, 103, 205,  77, 237, 109, 197,  69, 229, 101,
     15, 143,  47, 175,   7, 135,  39, 167,  13, 141,  45, 173,   5, 133,  37, 165,
    243, 115, 211,  83, 251, 123, 219,  91, 241, 113, 209,  81, 249, 121, 217,  89,
     51, 179,  19, 147,  59, 187,  27, 155,  49, 177,  17, 145,  57, 185,  25, 153,
    195,  67, 227,  99, 203,  75, 235, 107, 193,  65, 225,  97, 201,  73, 233, 105,
      3, 131,  35, 163,  11, 139,  43, 171,   1, 129,  33, 161,   9, 137,  41, 169,
    252, 124, 220,  92, 244, 116, 212,  84, 254, 126, 222,  94, 246, 118, 214,  86,
     60, 188,  28, 156,  52, 180,  20, 148,  62, 190,  30, 158,  54, 182,  22, 150,
    204,  76, 236, 108, 196,  68, 228, 100, 206,  78, 238, 110, 198,  70, 230, 102,
     12, 140,  44, 172,   4, 132,  36, 164,  14, 142,  46, 174,   6, 134,  38, 166,
    240, 112, 208,  80, 248, 120, 216,  88, 242, 114, 210,  82, 250, 122, 218,  90,
     48, 176,  16, 144,  56, 184,  24, 152,  50, 178,  18, 146,  58, 186,  26, 154,
    192,  64, 224,  96, 200,  72, 232, 104, 194,  66, 226,  98, 202,  74, 234, 106,
      0, 128,  32, 160,   8, 136,  40, 168,   2, 130,  34, 162,  10, 138,  42, 170
                                                  ]);

Application.prototype.make_dither = function()
{
    var gl = this.ctx;
    var texture = gl.createTexture();

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, 16, 16, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, this.dither);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

    this.check_error();

    return texture;
};

Application.prototype.setup_program = function()
{
    var gl = this.ctx;

    this.program = this.create_program('vshader', 'fshader');

    this.v_random   = gl.getUniformLocation(this.program, 't_random');

    this.a_position = gl.getAttribLocation(this.program, "a_position");
    this.a_texcoord = gl.getAttribLocation(this.program, "a_texcoord");

    this.check_error();
};

Application.prototype.setup_buffers = function()
{
    var gl = this.ctx;

    var verts = [];
    var texco = [];

    var k = 2*(this.steps + 1);
    for (var i = 0; i <= this.steps; i++) {
        var g = this.g_min + i * (this.g_max - this.g_min) / this.steps;
        var y0 = (2*i + 0) / k * 2 - 1;
        var y1 = (2*i + 1) / k * 2 - 1;
        var y2 = (2*i + 2) / k * 2 - 1;
        verts.push([-1,y0, 1,y0, -1,y1, 1,y1]);
        texco.push([ 0,-g, 1,-g,  0,-g, 1,-g]);
        verts.push([-1,y1, 1,y1, -1,y2, 1,y2]);
        texco.push([ 0, g, 1, g,  0, g, 1, g]);
    }

    this.position_buffer = this.array_buffer(verts, 1);
    this.texcoord_buffer = this.array_buffer(texco, 1);

    this.check_error();
};

Application.prototype.setup_texture = function()
{
    this.random = this.make_dither();
};

Application.prototype.setup = function()
{
    this.setup_program();
    this.setup_buffers();
    this.setup_texture();
};

Application.prototype.draw = function()
{
    var gl = this.ctx;

    gl.useProgram(this.program);

    gl.bindTexture(gl.TEXTURE_2D, this.random);
    gl.uniform1i(this.v_random, 0);

    gl.enableVertexAttribArray(this.a_position);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.position_buffer);
    gl.vertexAttribPointer(this.a_position, 2, gl.FLOAT, false, 0, 0);

    gl.enableVertexAttribArray(this.a_texcoord);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texcoord_buffer);
    gl.vertexAttribPointer(this.a_texcoord, 2, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 8*(this.steps + 1));

    gl.disableVertexAttribArray(this.a_texcoord);
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

