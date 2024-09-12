"use strict";

var Sphere = function(view, levels) {
    if (levels == null)
	return;

    this.view = view;
    this.levels = levels;
};

Sphere.prototype = new Object;

Sphere.prototype.ico_verts = [
    [ 0.0          ,   0.0           ,  1.0           ],
    [ 0.894427191000,  0.0           ,  0.447213595500],
    [ 0.276393202252,  0.850650808354,  0.447213595500],
    [-0.723606797748,  0.525731112119,  0.447213595500],
    [-0.723606797748, -0.525731112119,  0.447213595500],
    [ 0.276393202252, -0.850650808354,  0.447213595500],
    [-0.894427191000,  0.0           , -0.447213595500],
    [-0.276393202252,  0.850650808354, -0.447213595500],
    [ 0.723606797748,  0.525731112119, -0.447213595500],
    [ 0.723606797748, -0.525731112119, -0.447213595500],
    [-0.276393202252, -0.850650808354, -0.447213595500],
    [ 0.0           ,  0.0           , -1.0           ]];

Sphere.prototype.ico_faces = [
    [ 0,  1,  2],
    [ 0,  2,  3],
    [ 0,  3,  4],
    [ 0,  4,  5],
    [ 0,  5,  1],
    [ 1,  8,  2],
    [ 2,  7,  3],
    [ 3,  6,  4],
    [ 4, 10,  5],
    [ 5,  9,  1],
    [ 1,  9,  8],
    [ 2,  8,  7],
    [ 3,  7,  6],
    [ 4,  6, 10],
    [ 5, 10,  9],
    [11,  9, 10],
    [11,  8,  9],
    [11,  7,  8],
    [11,  6,  7],
    [11, 10,  6]];

Sphere.prototype.subdivide = function() {
    var base = this.vertices.length;

    var edges = [];
    var edge_map = {};
    var face_edges = [];
    for (var fi = 0; fi < this.faces.length; fi++) {
	var face = this.faces[fi];
	var a = face[0];
	var b = face[1];
	var c = face[2];
	var fedges = [];
	var pairs = [[a,b],[b,c],[c,a]];
	for (var pi = 0; pi < 3; pi++) {
	    var pair = pairs[pi];
	    var i = pair[0];
	    var j = pair[1];
	    if (i > j) {
		var t = j;
		j = i;
		i = t;
	    }
	    if (!([i, j] in edge_map)) {
		edge_map[[i,j]] = edges.length;
		edges.push([i,j]);
	    }
	    fedges.push(edge_map[[i,j]]);
	}
	face_edges.push(fedges);
    }

    for (var ei = 0; ei < edges.length; ei++) {
	var nv = [0, 0, 0];
	Vector_add(nv, this.vertices[edges[ei][0]]);
	Vector_add(nv, this.vertices[edges[ei][1]]);
	Vector_normalize(nv);
	this.vertices.push(nv);
    }

    var nfaces = [];
    for (var i = 0; i < this.faces.length; i++) {
	var v = this.faces[i];
	var e = face_edges[i];
	nfaces.push([base+e[2],v[0],base+e[0]]);
	nfaces.push([base+e[0],v[1],base+e[1]]);
	nfaces.push([base+e[1],v[2],base+e[2]]);
	nfaces.push([base+e[0],base+e[1],base+e[2]]);
    }

    this.faces = nfaces;
};

Sphere.prototype.make = function()
{
    var gl = this.view.ctx;

    this.vertices = this.ico_verts.slice(0);
    this.faces = this.ico_faces;
    for (var i = 0; i < this.levels; i++)
	this.subdivide();

    this.indices = new Uint16Array(Array2D_flat(this.faces));
    this.vertices = new Float32Array(Array2D_flat(this.vertices));
    this.faces = null;

    this.vertex_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertex_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    this.index_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.index_buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
};

