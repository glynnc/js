"use strict";

var Ball = function(view, x, y, radius, levels)
{
    if (radius == null)
	radius = 0.2;
    if (levels == null)
	levels = 2;

    Sphere.call(this, view, levels);

    this.radius = radius;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;

    this.maze = null;
};

Ball.prototype = Object.create(Sphere.prototype);

Ball.prototype.emission = [0, 0, 0, 1];
Ball.prototype.ambient = [0, 0.8, 0, 1];
Ball.prototype.diffuse = Ball.prototype.ambient.slice(0);
Ball.prototype.specular = [1, 1, 1, 1];
Ball.prototype.shininess = 100.0;

Ball.prototype.update = function(t, ax, ay) {
    this.vx += ax * t;
    this.vy += ay * t;
    var x0 = this.x;
    var y0 = this.y;
    for (var i = 0; i < 10; i++) {
	var dx = this.vx * t;
	var dy = this.vy * t;
	var x1 = x0 + dx;
	var y1 = y0 + dy;
	var c = this.maze.collision(x0, y0, x1, y1, this.radius);
	var k = c[0];
	var d = c[1];
	if (d == null || k >= 1)
	    break;
	var nx = d[0];
	var ny = d[1];
	x0 += k * (x1 - x0);
	y0 += k * (y1 - y0);
	var dp = nx * this.vx + ny * this.vy;
	dp *= -1 - elasticity;
	this.vx += dp * nx;
	this.vy += dp * ny;
	t *= (1 - k);
    }
    this.x = x1;
    this.y = y1;
};

Ball.prototype.matrix = function() {
    var x = this.x;
    var y = this.y;
    var r = this.radius;
    var s = r;
    var m = Matrix.identity();
    m.postmultiply(Matrix.translate(x, y, r));
    m.postmultiply(Matrix.scale(s, s, s));
    return m;
};

Ball.prototype.draw = function(m)
{
    var gl = this.view.ctx;

    m.postmultiply(this.matrix());

    gl.uniformMatrix4fv(gl.getUniformLocation(this.view.program, 'mv_matrix'), false, new Float32Array(m.as_array()));

    gl.uniform4fv(gl.getUniformLocation(this.view.program, 'material_emission'),  new Float32Array(this.emission));
    gl.uniform4fv(gl.getUniformLocation(this.view.program, 'material_ambient'),   new Float32Array(this.ambient));
    gl.uniform4fv(gl.getUniformLocation(this.view.program, 'material_diffuse'),   new Float32Array(this.diffuse));
    gl.uniform4fv(gl.getUniformLocation(this.view.program, 'material_specular'),  new Float32Array(this.specular));
    gl.uniform1f(gl.getUniformLocation(this.view.program, 'material_shininess'), this.shininess);

    var vertex_attrib = gl.getAttribLocation(this.view.program, "a_Position");
    var normal_attrib = gl.getAttribLocation(this.view.program, "a_Normal");

    gl.enableVertexAttribArray(vertex_attrib);
    gl.enableVertexAttribArray(normal_attrib);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertex_buffer);
    gl.vertexAttribPointer(vertex_attrib, 3, gl.FLOAT, false, 0, 0);
    gl.vertexAttribPointer(normal_attrib, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.index_buffer);

    gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);
};

