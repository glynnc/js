"use strict";

function angle_quaternion(v)
{
    var sr = Math.sin(v[0] / 2);
    var cr = Math.cos(v[0] / 2);
    var sp = Math.sin(v[1] / 2);
    var cp = Math.cos(v[1] / 2);
    var sy = Math.sin(v[2] / 2);
    var cy = Math.cos(v[2] / 2);

    return [
        sr * cp * cy - cr * sp * sy,
        cr * sp * cy + sr * cp * sy,
        cr * cp * sy - sr * sp * cy,
        cr * cp * cy + sr * sp * sy];
}

function quaternion_matrix(q)
{
    var c00 = 1 - 2 * q[1] * q[1] - 2 * q[2] * q[2];
    var c01 = 2 * q[0] * q[1] - 2 * q[3] * q[2];
    var c02 = 2 * q[0] * q[2] + 2 * q[3] * q[1];

    var c10 = 2 * q[0] * q[1] + 2 * q[3] * q[2];
    var c11 = 1 - 2 * q[0] * q[0] - 2 * q[2] * q[2];
    var c12 = 2 * q[1] * q[2] - 2 * q[3] * q[0];

    var c20 = 2 * q[0] * q[2] - 2 * q[3] * q[1];
    var c21 = 2 * q[1] * q[2] + 2 * q[3] * q[0];
    var c22 = 1 - 2 * q[0] * q[0] - 2 * q[1] * q[1];

    return new Matrix(
	[c00, c01, c02, 0,
	 c10, c11, c12, 0,
	 c20, c21, c22, 0,
	   0,   0,   0, 1]);
}

function quaternion_slerp(p, q, t)
{
    var delta = 0.000001;

    // is one of the quaternions backwards ?
    var a = 0;
    var b = 0;
    for (var i = 0; i < 4; i++) {
	a += Math.pow(p[i] - q[i], 2);
	b += Math.pow(p[i] + q[i], 2);
    }

    if (a > b)
	q = vector_negate(q);

    var cosom = 0;
    for (var i = 0; i < 4; i++)
	cosom += p[i] * q[i];

    if (cosom < 0) {
	q = vector_negate(q);
        cosom = -cosom;
    }

    var sp, sq;
    if (1 - cosom > delta) {
        var omega = Math.acos(cosom);
        var sinom = Math.sin(omega);
        sp = Math.sin((1 - t) * omega) / sinom;
        sq = Math.sin(     t  * omega) / sinom;
    }
    else {
        sp = 1 - t;
        sq = t;
    }

    return vector_add(vector_scale(p, sp), vector_scale(q, sq));
}

