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
    this.v_matrix = null;
    this.v_color = null;
    this.a_pos = null;

    this.count = null;
    this.nodes = null;
    this.quad_buffer = null;
    this.pos_buffer = null;

    this.speed = 0.0;    // units/sec
    this.speed_r = 0.02; // units/sec/sec
    this.angle = 0.0;    // radians
    this.angle_r = 1.0;  // rad/sec
    this.size = 0.02;    // node size
    this.spacing = 0.2;  // node spacing

    this.identity = new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);
};

Application.prototype.setup = function()
{
    this.setup_data();
    this.setup_buffers();
    this.setup_program();
    this.check_error();
};

Application.prototype.setup_data = function()
{
    this.count = 4;
    var x = 0;
    var coords = [];
    for (var i = 0; i < this.count; i++) {
        coords.push(x);
        coords.push(0);
        x -= this.spacing;
    }
    this.nodes = new Float32Array(coords);
};

Application.prototype.setup_buffers = function()
{
    var gl = this.ctx;

    this.pos_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.pos_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.nodes, gl.STATIC_DRAW);

    this.quad_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad_buffer);
    var quad = new Float32Array([-1,-1, 1,-1, -1,1, 1,1]);
    gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
};

Application.prototype.setup_program = function()
{
    var gl = this.ctx;

    this.program = this.create_program('vshader', 'fshader');

    this.v_color = gl.getUniformLocation(this.program, 'color');
    this.v_matrix = gl.getUniformLocation(this.program, 'matrix');

    this.a_pos = gl.getAttribLocation(this.program, "a_pos");
};

Application.prototype.get = function(i)
{
    var n = 2*i;
    var x = this.nodes[n+0];
    var y = this.nodes[n+1];
    return [x, y];
};

Application.prototype.put = function(i, x, y)
{
    var n = 2*i;
    this.nodes[n+0] = x;
    this.nodes[n+1] = y;
};

Application.prototype.draw = function()
{
    var gl = this.ctx;

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.disable(gl.DEPTH_TEST);
    gl.useProgram(this.program);

    gl.enableVertexAttribArray(this.a_pos);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.pos_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.nodes, gl.STATIC_DRAW);
    gl.vertexAttribPointer(this.a_pos, 2, gl.FLOAT, false, 0, 0);

    gl.uniform3f(this.v_color, 1.0, 0.0, 0.0);
    gl.uniformMatrix4fv(this.v_matrix, false, this.identity);
    gl.drawArrays(gl.LINE_STRIP, 0, this.count);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad_buffer);
    gl.vertexAttribPointer(this.a_pos, 2, gl.FLOAT, false, 0, 0);

    for (var i = 0; i < this.count; i++) {
        var p = this.get(i);
        var x = p[0], y = p[1];
        var px, py;
        var u, v;
        if (i == 0) {
            u = this.size*Math.cos(this.angle);
            v = this.size*Math.sin(this.angle);
            gl.uniform3f(this.v_color, 0, 1, 0);
        }
        else {
            var dx = px-x, dy = py-y;
            var d = Math.hypot(dx, dy);
            var k = this.size/d;
            u = k*dx;
            v = k*dy;
            gl.uniform3f(this.v_color, 0, 0, 1);
        }
        px = x, py = y;
        var m = [u,v,0,0, -v,u,0,0, 0,0,1,0, x,y,0,1];
        gl.uniformMatrix4fv(this.v_matrix, false, new Float32Array(m));
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    gl.flush();
    
    this.check_error();
};

Application.prototype.handle_keys = function(t)
{
    if (this.key_state["Left"])
        this.angle += this.angle_r * t;
    if (this.key_state["Right"])
        this.angle -= this.angle_r * t;
    if (this.key_state["Up"])
        this.speed += this.speed_r * t;
    if (this.key_state["Down"])
        this.speed -= this.speed_r * t;
    this.speed = Math.max(0, this.speed); // no reversing
}

Application.prototype.update = function()
{
    var sx = this.speed * Math.cos(this.angle);
    var sy = this.speed * Math.sin(this.angle);

    this.nodes[0] += sx;
    this.nodes[1] += sy;

    for (var i = 1; i < this.count; i++) {
        var a = this.get(i-1);
        var ax = a[0];
        var ay = a[1];
        var b = this.get(i);
        var bx = b[0];
        var by = b[1];
        var dx = ax-bx;
        var dy = ay-by;
        var d = Math.hypot(dx, dy);
        dx /= d;
        dy /= d;
        var k = dx*sx+dy*sy; // dot(D,S)
        sx = k*dx;
        sy = k*dy;
        bx += sx;
        by += sy;
        // normalise offset to prevent drift
        dx = bx-ax;
        dy = by-ay;
        d = Math.hypot(dx, dy);
        var k = this.spacing/d;
        dx *= k;
        dy *= k;
        bx = ax+dx;
        by = ay+dy;
        this.put(i, bx, by);
    }
};

// ************************************************************

var app = null;

function init()
{
    var canvas = document.getElementById("canvas");
    app = new Application(canvas);
    setInterval(app.refresh.bind(app), 20);
}

// ************************************************************

