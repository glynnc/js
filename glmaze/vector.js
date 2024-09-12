"use strict";

function Vector_copy(v) {
    return v.slice(0);
};

function Vector_add(v, a) {
    for (var i = 0; i < v.length; i++)
	v[i] += a[i];
};

function Vector_multiply(v, x) {
    for (var i = 0; i < v.length; i++)
	v[i] *= x;
};

function Vector_divide(v, x) {
    for (var i = 0; i < v.length; i++)
	v[i] /= x;
};

function Vector_floor(v) {
    for (var i = 0; i < v.length; i++)
	v[i] = Math.floor(v[i]);
};

function Vector_magnitude(v) {
    var sumsq = 0;
    for (var i = 0; i < v.length; i++) {
	var x = v[i];
	sumsq += x * x;
    }
    return Math.sqrt(sumsq);
};

function Vector_normalize(v) {
    var k = Vector_magnitude(v);
    if (k == 0)
	return;
    Vector_divide(v, k);
};

function Array2D_create(h, w, val) {
    var result = new Array;
    for (var j = 0; j < h; j++) {
	result[j] = new Array;
	for (var i = 0; i < w; i++)
	    result[j][i] = val;
    }
    return result;
};

function Array2D_flat(a) {
    var result = new Array;
    for (var j = 0; j < a.length; j++)
	for (var i = 0; i < a[j].length; i++)
	    result.push(a[j][i]);
    return result;
};

var Vector = function(a)
{
    for (var i = 0; i < a.length; i++)
	this[i] = a[i];
};

Vector.prototype = new Array;

Vector.prototype.copy = function() { return Vector_copy(this); };
Vector.prototype.add = function(v) { Vector_add(this, v) };
Vector.prototype.multiply = function(v) { Vector_multiply(this, v) };
Vector.prototype.divide = function(x) { Vector_divide(this, x) };
Vector.prototype.magnitude = function() { return Vector_magnitude(this); };
Vector.prototype.normalize = function() { Vector_normalize(this) };
