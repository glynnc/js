"use strict";

function vector_add(a, b)
{
    var result = [];
    for (var i = 0; i < a.length; i++)
	result.push(a[i] + b[i]);
    return result;
}

function vector_sub(a, b)
{
    var result = [];
    for (var i = 0; i < a.length; i++)
	result.push(a[i] - b[i]);
    return result;
}

function vector_mul(a, b)
{
    var result = [];
    for (var i = 0; i < a.length; i++)
	result.push(a[i] * b[i]);
    return result;
}

function vector_scale(a, k)
{
    var result = [];
    for (var i = 0; i < a.length; i++)
	result.push(a[i] * k);
    return result;
}

function vector_interpolate(a, b, k)
{
    var result = [];
    for (var i = 0; i < a.length; i++)
	result.push((1-k) * a[i] + k * b[i]);
    return result;
}

function vector_negate(v)
{
    var result = [];
    for (var i = 0; i < v.length; i++)
	result.push(-v[i]);
    return result;
}

function vector_dot(a, b)
{
    var result = 0;
    for (var i = 0; i < a.length; i++)
	result += a[i] * b[i];
    return result;
}

function vector_magnitude2(a)
{
    return vector_dot(a, a);
}

function vector_magnitude(a)
{
    return Math.sqrt(vector_magnitude2(a));
}

function vector_normalize(a)
{
    return vector_scale(a, 1/vector_magnitude(a));
}

function vector_cross(a, b)
{
    return [
	a[1] * b[2] - a[2] * b[1],
	a[2] * b[0] - a[0] * b[2],
	a[0] * b[1] - a[1] * b[0]];
}
