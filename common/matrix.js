"use strict";

var Matrix = function(mat)
{
    this.$m = new Array(4);
    for (var j = 0; j < 4; j++)
	this.$m[j] = new Array(4);

    if (typeof mat == 'object') {
        if ("length" in mat && mat.length >= 16) {
            this.set(mat);
            return;
        }
        else if (mat instanceof Matrix) {
            this.set(mat);
            return;
        }
    }

    this.identity();
};

Matrix.prototype = new Object;

Matrix.prototype.set = function(mat)
{
    if (typeof mat == 'object') {
        if (mat instanceof Matrix) {
	    for (var j = 0; j < 4; j++)
		for (var i = 0; i < 4; i++)
		    this.$m[j][i] = mat.$m[j][i];
            return;
        }

	if ("length" in mat && mat.length >= 16) {
	    var n = 0;
	    for (var j = 0; j < 4; j++)
		for (var i = 0; i < 4; i++)
		    this.$m[j][i] = mat[n++];
            return;
        }
    }
};

Matrix.prototype.as_array = function()
{
    var a = [];

    for (var j = 0; j < 4; j++)
	for (var i = 0; i < 4; i++)
	    // a.push(this.$m[j][i]);
	    a.push(this.$m[i][j]);

    return a;
};

Matrix.prototype.clone = function()
{
    return new Matrix(this);
};

Matrix.prototype.identity = function()
{
    for (var j = 0; j < 4; j++)
	for (var i = 0; i < 4; i++)
	    this.$m[j][i] = i == j ? 1 : 0;
};

Matrix.identity = function()
{
    return new Matrix();
};

Matrix.transpose = function(m)
{
    var result = new Matrix();

    for (var j = 0; j < 4; j++)
	for (var i = 0; i < 4; i++)
	    result.$m[j][i] = m.$m[i][j];

    return result;
};

Matrix.prototype.transposed = function()
{
    return Matrix.transpose(this);
};

Matrix.prototype.transpose = function()
{
    this.set(this.transposed());
};

Matrix.determinant = function(m)
{
    var m2 = m.$m[2];
    var m3 = m.$m[3];
    var d01 = m2[2] * m3[3] - m2[3] * m3[2];
    var d02 = m2[1] * m3[3] - m2[3] * m3[1];
    var d03 = m2[1] * m3[2] - m2[2] * m3[1];
    var d12 = m2[0] * m3[3] - m2[3] * m3[0];
    var d13 = m2[0] * m3[2] - m2[2] * m3[0];
    var d23 = m2[0] * m3[1] - m2[1] * m3[0];

    var m1 = m.$m[1];
    var d0 = m1[1] * d01 - m1[2] * d02 + m1[3] * d03;
    var d1 = m1[0] * d01 - m1[2] * d12 + m1[3] * d13;
    var d2 = m1[0] * d02 - m1[1] * d12 + m1[3] * d23;
    var d3 = m1[0] * d03 - m1[1] * d13 + m1[2] * d23;

    var m0 = m.$m[0];
    var d = m0[0] * d0 - m0[1] * d1 + m0[2] * d2 - m0[3] * d3;

    return d;
};

Matrix.prototype.determinant = function()
{
    return Matrix.determinant(this);
};

Matrix.inverse = function(m)
{
    var t = new Array(4);

    for (var j = 0; j < 4; j++) {
	t[j] = new Array(8);
	for (var i = 0; i < 4; i++) {
	    t[j][i+0] = m.$m[j][i];
	    t[j][i+4] = j == i ? 1 : 0;
	}
    }

    j = i = 0;
    while (j < 4 && i < 4) {
	// Find pivot in column i, starting in row j:
	var maxj = j;

	for (var jj = j+1; jj < 4; jj++)
	    if (Math.abs(t[jj][i]) >= Math.abs(t[maxj][i]))
		maxj = jj;

	if (t[maxj][i] != 0) {
	    // swap rows j and maxj
	    if (j != maxj) {
		var tmp = t[j];
		t[j] = t[maxj];
		t[maxj] = tmp;
	    }

	    var k = t[j][i];
	    for (var ii = 0; ii < 8; ii++)
		t[j][ii] /= k;

	    for (var jj = j+1; jj < 4; jj++) {
		var k = t[jj][i];
		for (var ii = 0; ii < 8; ii++)
		    t[jj][ii] -= k * t[j][ii];
	    }
	    j++;
	}

	i++;
    }

    for (var i = 3; i > 0; i--)
	for (var j = 0; j < i; j++) {
	    var k = t[j][i] / t[i][i];
	    for (var ii = 0; ii < 8; ii++)
		t[j][ii] -= k * t[i][ii];
	}

    var result = new Matrix();
    for (var j = 0; j < 4; j++)
	for (var i = 0; i < 4; i++)
	    result.$m[j][i] = t[j][i+4];

    return result;
};

Matrix.prototype.inverse = function()
{
    return Matrix.inverse(this);
};

Matrix.prototype.invert = function()
{
    this.set(this.inverse());
};

Matrix.multiply = function(a, b)
{
    var result = new Matrix();

    for (var j = 0; j < 4; j++) {
	for (var i = 0; i < 4; i++) {
	    var r = 0;
	    for (var k = 0; k < 4; k++)
		r += a.$m[j][k] * b.$m[k][i];
	    result.$m[j][i] = r;
	}
    }

    return result;
};

Matrix.prototype.premultiplied = function(mat)
{
    return Matrix.multiply(mat, this);
};

Matrix.prototype.premultiply = function(mat)
{
    this.set(this.premultiplied(mat));
};

Matrix.prototype.postmultiplied = function(mat)
{
    return Matrix.multiply(this, mat);
};

Matrix.prototype.postmultiply = function(mat)
{
    this.set(this.postmultiplied(mat));
};

Matrix.transform = function(mat, vec)
{
    var result = [];
    if (vec.length == 2)
	vec = [vec[0], vec[1], 0, 1];
    else if (vec.length == 3)
	vec = [vec[0], vec[1], vec[2], 1];
    for (var r = 0; r < 4; r++) {
	var x = 0;
	for (var c = 0; c < 4; c++)
	    x += mat.$m[r][c] * vec[c];
	result.push(x);
    }
    return result;
};

Matrix.prototype.transform = function (vec)
{
    return Matrix.transform(this, vec);
};

Matrix.translate = function(x, y, z)
{
    if (arguments.length == 1) {
	var v = arguments[0];
	x = v[0];
	y = v[1];
	z = v[2];
    }
    var mat = new Matrix();
    mat.$m[0][3] = x;
    mat.$m[1][3] = y;
    mat.$m[2][3] = z;
    return mat;
};

Matrix.scale = function(x, y, z)
{
    if (arguments.length == 1) {
	var v = arguments[0];
	x = v[0];
	y = v[1];
	z = v[2];
    }
    var mat = new Matrix();
    mat.$m[0][0] = x;
    mat.$m[1][1] = y;
    mat.$m[2][2] = z;
    return mat;
};

Matrix.rotx = function(angle, degrees)
{
    if (degrees)
	angle *= Math.PI / 180;
    var s = Math.sin(angle);
    var c = Math.cos(angle);
    var mat = new Matrix(
	[ 1, 0, 0, 0,
	  0, c,-s, 0,
	  0, s, c, 0,
	  0, 0, 0, 1]);
    return mat;
};

Matrix.roty = function(angle, degrees)
{
    if (degrees)
	angle *= Math.PI / 180;
    var s = Math.sin(angle);
    var c = Math.cos(angle);
    var mat = new Matrix(
	[ c, 0, s, 0,
	  0, 1, 0, 0,
	  -s, 0, c, 0,
	  0, 0, 0, 1]);
    return mat;
};

Matrix.rotz = function(angle, degrees)
{
    if (degrees)
	angle *= Math.PI / 180;
    var s = Math.sin(angle);
    var c = Math.cos(angle);
    var mat = new Matrix(
	[ c,-s, 0, 0,
	  s, c, 0, 0,
	  0, 0, 1, 0,
	  0, 0, 0, 1]);
    return mat;
};

Matrix.rotate = function(angle, x, y, z, degrees)
{
    if (degrees)
	angle *= Math.PI / 180;
    var s = Math.sin(angle);
    var c = Math.cos(angle);
    var nc = 1 - c;

    if (arguments.length == 2) {
	var v = arguments[1];
	x = v[0];
	y = v[1];
	z = v[2];
    }

    var len2 = x * x + y * y + z * z;

    if (len2 != 1 && len2 != 0) {
	var len = Math.sqrt(len2);
        x /= len;
        y /= len;
        z /= len;
    }

    var mat = new Matrix(
	[ x*x*nc +   c, x*y*nc - z*s, x*z*nc + y*s, 0,
	  y*x*nc + z*s, y*y*nc +   c, y*z*nc - x*s, 0,
	  x*z*nc - y*s, y*z*nc + x*s, z*z*nc +   c, 0,
	  0,            0,            0,            1]
	);

    return mat;
};

Matrix.shearx = function(angle_y, angle_z, degrees)
{
    if (degrees) {
	angle_y *= Math.PI / 180;
	angle_z *= Math.PI / 180;
    }
    var sy = Math.sin(angle_y);
    var cy = Math.cos(angle_y);
    var sz = Math.sin(angle_z);
    var cz = Math.cos(angle_z);
    var mat = new Matrix(
	[ 1,  0,  0, 0,
	  0, cy,-sz, 0,
	  0, sy, cz, 0,
	  0,  0,  0, 1]);
    return mat;
};

Matrix.sheary = function(angle_x, angle_z, degrees)
{
    if (degrees) {
	angle_x *= Math.PI / 180;
	angle_z *= Math.PI / 180;
    }
    var sx = Math.sin(angle_x);
    var cx = Math.cos(angle_x);
    var sz = Math.sin(angle_z);
    var cz = Math.cos(angle_z);
    var mat = new Matrix(
	[  cx, 0, sz, 0,
	    0, 1,  0, 0,
	  -sx, 0, cz, 0,
	    0, 0,  0, 1]);
    return mat;
};

Matrix.shearz = function(angle_x, angle_y, degrees)
{
    if (degrees) {
	angle_x *= Math.PI / 180;
	angle_y *= Math.PI / 180;
    }
    var sx = Math.sin(angle_x);
    var cx = Math.cos(angle_x);
    var sy = Math.sin(angle_y);
    var cy = Math.cos(angle_y);
    var mat = new Matrix(
	[ cx,-sy, 0, 0,
	  sx, cy, 0, 0,
	   0,  0, 1, 0,
	   0,  0, 0, 1]);
    return mat;
};

Matrix.ortho = function(l, r, b, t, n, f)
{
    var rx = -(r + l) / (r - l);
    var ry = -(t + b) / (t - b);
    var rz = -(f + n) / (f - n);
    
    var mat = new Matrix(
	[2/(r-l), 0,       0,       rx,
	 0,       2/(t-b), 0,       ry,
	 0,       0,      -2/(f-n), rz,
	 0,       0,       0,       1]
	);

    return mat;
};

Matrix.frustum = function(l, r, b, t, n, f)
{
    var A =  (r + l) / (r - l);
    var B =  (t + b) / (t - b);
    var C = -(f + n) / (f - n);
    var D = -(2 * f * n) / (f - n);

    var mat = new Matrix(
	[(2*n)/(r-l), 0,         A, 0,
	 0,           2*n/(t-b), B, 0,
	 0,           0,         C, D,
	 0,           0,        -1, 0]
	);
    
    return mat;
};

Matrix.perspective = function(fovy, aspect, n, f)
{
    fovy *= Math.PI / 180;

    var F = 1 / Math.tan(fovy/2);

    var mat = new Matrix(
	[F/aspect, 0,  0,           0,
	 0,        F,  0,           0,
	 0,        0,  (f+n)/(n-f), 2*f*n/(n-f),
	 0,        0, -1,           0]
	);

    return mat;
};

Matrix.viewport = function(x, y, w, h)
{
    var mat = new Matrix(
	[w/2, 0,   0,x+w/2,
	 0,   h/2, 0,y+h/2,
	 0,   0,   1,    0,
	 0,   0,   0,    1]);

    return mat;
};

Matrix.lookat = function(eye, target, up)
{
    var F = vector_sub(target, eye);
    var f = vector_normalize(F);
    var U = vector_normalize(up);
    var s = vector_cross(f, U);
    var u = vector_cross(vector_normalize(s), f);
    var M = new Matrix(
	[s[0], s[1], s[2], 0,
	 u[0], u[1], u[2], 0,
	-f[0],-f[1],-f[2], 0,
	    0,    0,    0, 1]);
    var T = Matrix.translate(vector_negate(eye));
    return Matrix.multiply(M, T);
};
