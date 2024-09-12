"use strict";

var Maze = function(view, w, h)
{
    this.view = view;
    this.w = w;
    this.h = h;
    this.grid = null;
    this.horz = null;
    this.vert = null;
    this.faces = null;
    this.walls_h = null;
    this.walls_v = null;
    this.vertices = null;
    this.normals = null;
    this.indices = null;

    this.ball = null;
};

Maze.prototype = new Object;

Maze.prototype.chamfer = 0.03;
Maze.prototype.offset = 0.05;
Maze.prototype.depth = 0.5;

Maze.prototype.emission = [0, 0, 0, 1];
Maze.prototype.ambient = [0.5, 0.5, 0.5, 1];
Maze.prototype.diffuse = Maze.prototype.ambient.slice(0);
Maze.prototype.specular  = [0.7, 0.7, 0.7, 1];
Maze.prototype.shininess = 100.0;

Maze.prototype.random_shuffle = function(list)
{
    var n = list.length;
    for (var i = 0; i < n; i++) {
        var j = i + Math.floor(Math.random() * (n - i));
        if (j == i)
            continue;
        var t = list[j];
        list[j] = list[i];
        list[i] = t;
    }
};

Maze.prototype.setup = function() {
    this.grid = Array2D_create(this.h, this.w, false);
    this.horz = Array2D_create(this.h+1, this.w, true);
    this.vert = Array2D_create(this.h, this.w+1, true);
};

Maze.prototype.generate = function(x, y) {
    this.grid[y][x] = true;
    var dirs = [[0,1],[1,0],[0,-1],[-1,0]];
    this.random_shuffle(dirs);
    for (var di in dirs) {
        var dir = dirs[di];
        var dx = dir[0];
        var dy = dir[1];
        var nx = x + dx;
        var ny = y + dy;
        if (nx < 0 || nx >= this.w || ny < 0 || ny >= this.h)
            continue;
        if (this.grid[ny][nx])
            continue;
        if (dx == 0)
            this.horz[Math.max(y,ny)][x] = false;
        if (dy == 0)
            this.vert[y][Math.max(x,nx)] = false;
        this.generate(nx, ny);
    }
};

Maze.prototype.quad = function(normal, p0, p1, p2, p3) {
    this.faces.push([[normal, p0], [normal, p1], [normal, p2]]);
    this.faces.push([[normal, p2], [normal, p3], [normal, p0]]);
};

Maze.prototype.bevel = function(n0, p0, n1, p1, n2, p2, n3, p3) {
    this.faces.push([[n0, p0], [n1, p1], [n2, p2]]);
    this.faces.push([[n2, p2], [n3, p3], [n0, p0]]);
};

Maze.prototype.tri = function(n0, p0, n1, p1, n2, p2) {
    this.faces.push([[n0, p0], [n1, p1], [n2, p2]]);
};

Maze.prototype.wall_h = function(y, dy, x0, x1) {
    this.walls_h.push([y, dy, x0, x1]);
};

Maze.prototype.wall_v = function(x, dx, y0, y1) {
    this.walls_v.push([x, dx, y0, y1]);
};

Maze.prototype.corner = function(x, y, dx, dy) {
    this.corners.push([x, y, dx, dy]);
};

Maze.prototype.build_horz = function() {
    for (var y = 0; y <= this.h; y++) {
        for (var x = 0; x < this.w; x++) {
            if (!this.horz[y][x])
                continue;
            var x0 = x + this.offset;
            var x1 = x + 1 - this.offset;
            var y0 = y - this.offset;
            var y3 = y + this.offset;
            var y1 = y0 + this.chamfer;
            var y2 = y3 - this.chamfer;
            var z0 = 0;
            var z2 = this.depth;
            var z1 = z2 - this.chamfer;
            this.quad([ 0,-1, 0], [x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1]);
            this.bevel([ 0,-1, 0], [x0,y0,z1],
                       [ 0,-1, 0], [x1,y0,z1],
                       [ 0, 0, 1], [x1,y1,z2],
                       [ 0, 0, 1], [x0,y1,z2]);
            this.quad([ 0, 0, 1], [x0,y1,z2],[x1,y1,z2],[x1,y2,z2],[x0,y2,z2]);
            this.bevel([ 0, 0, 1], [x0,y2,z2],
                       [ 0, 0, 1], [x1,y2,z2],
                       [ 0, 1, 0], [x1,y3,z1],
                       [ 0, 1, 0], [x0,y3,z1]);
            this.quad([ 0, 1, 0], [x1,y3,z0],[x0,y3,z0],[x0,y3,z1],[x1,y3,z1]);
            this.wall_h(y0, -1, x0, x1);
            this.wall_h(y3,  1, x0, x1);
        }
    }
};

Maze.prototype.build_vert = function() {
    for (var y = 0; y < this.h; y++) {
        for (var x = 0; x <= this.w; x++) {
            if (!this.vert[y][x])
                continue;
            var y0 = y + this.offset;
            var y1 = y + 1 - this.offset;
            var x0 = x - this.offset;
            var x3 = x + this.offset;
            var x1 = x0 + this.chamfer;
            var x2 = x3 - this.chamfer;
            var z0 = 0;
            var z2 = this.depth;
            var z1 = z2 - this.chamfer;
            this.quad([-1, 0, 0], [x0,y1,z0],[x0,y0,z0],[x0,y0,z1],[x0,y1,z1]);
            this.bevel([-1, 0, 0], [x0,y0,z1],
                       [ 0, 0, 1], [x1,y0,z2],
                       [ 0, 0, 1], [x1,y1,z2],
                       [-1, 0, 0], [x0,y1,z1]);
            this.quad([ 0, 0, 1], [x1,y0,z2],[x2,y0,z2],[x2,y1,z2],[x1,y1,z2]);
            this.bevel([ 1, 0, 0], [x3,y1,z1],
                       [ 0, 0, 1], [x2,y1,z2],
                       [ 0, 0, 1], [x2,y0,z2],
                       [ 1, 0, 0], [x3,y0,z1]);
            this.quad([ 1, 0, 0], [x3,y0,z0],[x3,y1,z0],[x3,y1,z1],[x3,y0,z1]);
            this.wall_v(x0, -1, y0, y1);
            this.wall_v(x3,  1, y0, y1);
        }
    }
};

Maze.prototype.build_joins = function() {
    for (var y = 0; y <= this.h; y++) {
        for (var x = 0; x <= this.w; x++) {
            var l = x > 0 && this.horz[y][x-1];
            var r = x < this.w && this.horz[y][x];
            var b = y > 0 && this.vert[y-1][x];
            var t = y < this.h && this.vert[y][x];
            var y0 = y - this.offset;
            var y3 = y + this.offset;
            var x0 = x - this.offset;
            var x3 = x + this.offset;
            var z0 = 0;
            var z2 = this.depth;
            var x1 = x0 + this.chamfer;
            var x2 = x3 - this.chamfer;
            var y1 = y0 + this.chamfer;
            var y2 = y3 - this.chamfer;
            var z1 = z2 - this.chamfer;

            if (l)
                this.quad([ 0, 0, 1], [x0,y1,z2],[x1,y1,z2],[x1,y2,z2],[x0,y2,z2]);
            else {
                this.quad([-1, 0, 0], [x0,y2,z0],[x0,y1,z0],[x0,y1,z1],[x0,y2,z1]);
                this.bevel([-1, 0, 0], [x0,y1,z1],
                           [ 0, 0, 1], [x1,y1,z2],
                           [ 0, 0, 1], [x1,y2,z2],
                           [-1, 0, 0], [x0,y2,z1]);
                this.wall_v(x0, -1, y0, y3);
            }
            
            if (r)
                this.quad([ 0, 0, 1], [x2,y1,z2],[x3,y1,z2],[x3,y2,z2],[x2,y2,z2]);
            else {
                this.quad([ 1, 0, 0], [x3,y1,z0],[x3,y2,z0],[x3,y2,z1],[x3,y1,z1]);
                this.bevel([ 0, 0, 1], [x2,y1,z2],
                           [ 1, 0, 0], [x3,y1,z1],
                           [ 1, 0, 0], [x3,y2,z1],
                           [ 0, 0, 1], [x2,y2,z2]);
                this.wall_v(x3,  1, y0, y3);
            }
            
            if (b)
                this.quad([ 0, 0, 1], [x1,y0,z2],[x2,y0,z2],[x2,y1,z2],[x1,y1,z2]);
            else {
                this.quad([ 0,-1, 0], [x1,y0,z0],[x2,y0,z0],[x2,y0,z1],[x1,y0,z1]);
                this.bevel([ 0,-1, 0], [x1,y0,z1],
                           [ 0,-1, 0], [x2,y0,z1],
                           [ 0, 0, 1], [x2,y1,z2],
                           [ 0, 0, 1], [x1,y1,z2]);
                this.wall_h(y0, -1, x0, x3);
            }

            if (t)
                this.quad([ 0, 0, 1], [x1,y2,z2],[x2,y2,z2],[x2,y3,z2],[x1,y3,z2]);
            else {
                this.quad([ 0, 1, 0], [x2,y3,z0],[x1,y3,z0],[x1,y3,z1],[x2,y3,z1]);
                this.bevel([ 0, 0, 1], [x1,y2,z2],
                           [ 0, 0, 1], [x2,y2,z2],
                           [ 0, 1, 0], [x2,y3,z1],
                           [ 0, 1, 0], [x1,y3,z1]);
                this.wall_h(y3,  1, x0, x3);
            }

            this.quad([ 0, 0, 1], [x1,y1,z2],[x2,y1,z2],[x2,y2,z2],[x1,y2,z2]);

            // bottom left
            if (l) {
                if (b) {
                    this.tri([-1,-1, 0], [x0,y0,z1],
                             [ 0, 0, 1], [x1,y0,z2],
                             [ 0, 0, 1], [x0,y1,z2]);
                    this.tri([ 0, 0, 1], [x1,y1,z2],
                             [ 0, 0, 1], [x0,y1,z2],
                             [ 0, 0, 1], [x1,y0,z2]);
                }
                else {
                    this.quad([ 0,-1, 0], [x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1]);
                    this.bevel([ 0,-1, 0], [x0,y0,z1],
                               [ 0,-1, 0], [x1,y0,z1],
                               [ 0, 0, 1], [x1,y1,z2],
                               [ 0, 0, 1], [x0,y1,z2]);
                }
            }
            else {
                if (b) {
                    this.quad([-1, 0, 0], [x0,y0,z0],[x0,y0,z1],[x0,y1,z1],[x0,y1,z0]);
                    this.bevel([-1, 0, 0], [x0,y0,z1],
                               [ 0, 0, 1], [x1,y0,z2],
                               [ 0, 0, 1], [x1,y1,z2],
                               [-1, 0, 0], [x0,y1,z1]);
                }
                else {
                    this.bevel([ 0,-1, 0], [x1,y0,z0],
                               [ 0,-1, 0], [x1,y0,z1],
                               [-1, 0, 0], [x0,y1,z1],
                               [-1, 0, 0], [x0,y1,z0]);
                    this.tri([ 0, 0, 1], [x1,y1,z2],
                             [-1, 0, 0], [x0,y1,z1],
                             [ 0,-1, 0], [x1,y0,z1]);
                    this.corner(x0, y0, -1, -1);
                }
            }

            // bottom right
            if (r) {
                if (b) {
                    this.tri([ 1,-1, 0], [x3,y0,z1],
                             [ 0, 0, 1], [x3,y1,z2],
                             [ 0, 0, 1], [x2,y0,z2]);
                    this.tri([ 0, 0, 1], [x2,y1,z2],
                             [ 0, 0, 1], [x2,y0,z2],
                             [ 0, 0, 1], [x3,y1,z2]);
                }
                else {
                    this.quad([ 0,-1, 0], [x2,y0,z0],[x3,y0,z0],[x3,y0,z1],[x2,y0,z1]);
                    this.bevel([ 0,-1, 0], [x2,y0,z1],
                               [ 0,-1, 0], [x3,y0,z1],
                               [ 0, 0, 1], [x3,y1,z2],
                               [ 0, 0, 1], [x2,y1,z2]);
                }
            }
            else {
                if (b) {
                    this.quad([ 1, 0, 0], [x3,y1,z0],[x3,y1,z1],[x3,y0,z1],[x3,y0,z0]);
                    this.bevel([ 1, 0, 0], [x3,y1,z1],
                               [ 0, 0, 1], [x2,y1,z2],
                               [ 0, 0, 1], [x2,y0,z2],
                               [ 1, 0, 0], [x3,y0,z1]);
                }
                else {
                    this.bevel([ 1, 0, 0], [x3,y1,z0],
                               [ 1, 0, 0], [x3,y1,z1],
                               [ 0,-1, 0], [x2,y0,z1],
                               [ 0,-1, 0], [x2,y0,z0]);
                    this.tri([ 0, 0, 1], [x2,y1,z2],
                             [ 0,-1, 0], [x2,y0,z1],
                             [-1, 0, 0], [x3,y1,z1]);
                    this.corner(x3, y0,  1, -1);
                }
            }

            // top left
            if (l) {
                if (t) {
                    this.tri([-1, 1, 0], [x0,y3,z1],
                             [ 0, 0, 1], [x0,y2,z2],
                             [ 0, 0, 1], [x1,y3,z2]);
                    this.tri([ 0, 0, 1], [x1,y2,z2],
                             [ 0, 0, 1], [x1,y3,z2],
                             [ 0, 0, 1], [x0,y2,z2]);
                }
                else {
                    this.quad([ 0, 1, 0], [x0,y3,z1],[x1,y3,z1],[x1,y3,z0],[x0,y3,z0]);
                    this.bevel([ 0, 0, 1], [x0,y2,z2],
                               [ 0, 0, 1], [x1,y2,z2],
                               [ 0, 1, 0], [x1,y3,z1],
                               [ 0, 1, 0], [x0,y3,z1]);
                }
            }
            else {
                if (t) {
                    this.quad([-1, 0, 0], [x0,y2,z0],[x0,y2,z1],[x0,y3,z1],[x0,y3,z0]);
                    this.bevel([-1, 0, 0], [x0,y2,z1],
                               [ 0, 0, 1], [x1,y2,z2],
                               [ 0, 0, 1], [x1,y3,z2],
                               [-1, 0, 0], [x0,y3,z1]);
                }
                else {
                    this.bevel([-1, 0, 0], [x0,y2,z0],
                               [-1, 0, 0], [x0,y2,z1],
                               [ 0, 1, 0], [x1,y3,z1],
                               [ 0, 1, 0], [x1,y3,z0]);
                    this.tri([ 0, 0, 1], [x1,y2,z2],
                             [ 0, 1, 0], [x1,y3,z1],
                             [-1, 0, 0], [x0,y2,z1]);
                    this.corner(x0, y3, -1,  1);
                }
            }

            // top right
            if (r) {
                if (t) {
                    this.tri([ 1, 1, 0], [x3,y3,z1],
                             [ 0, 0, 1], [x2,y3,z2],
                             [ 0, 0, 1], [x3,y2,z2]);
                    this.tri([ 0, 0, 1], [x2,y2,z2],
                             [ 0, 0, 1], [x3,y2,z2],
                             [ 0, 0, 1], [x2,y3,z2]);
                }
                else {
                    this.quad([ 0, 1, 0], [x2,y3,z1],[x3,y3,z1],[x3,y3,z0],[x2,y3,z0]);
                    this.bevel([ 0, 0, 1], [x2,y2,z2],
                               [ 0, 0, 1], [x3,y2,z2],
                               [ 0, 1, 0], [x3,y3,z1],
                               [ 0, 1, 0], [x2,y3,z1]);
                }
            }
            else {
                if (t) {
                    this.quad([ 1, 0, 0], [x3,y3,z0],[x3,y3,z1],[x3,y2,z1],[x3,y2,z0]);
                    this.bevel([ 1, 0, 0], [x3,y3,z1],
                               [ 0, 0, 1], [x2,y3,z2],
                               [ 0, 0, 1], [x2,y2,z2],
                               [ 1, 0, 0], [x3,y2,z1]);
                }
                else {
                    this.bevel([ 0, 1, 0], [x2,y3,z0],
                               [ 0, 1, 0], [x2,y3,z1],
                               [ 1, 0, 0], [x3,y2,z1],
                               [ 1, 0, 0], [x3,y2,z0]);
                    this.tri([ 0, 0, 1], [x2,y2,z2],
                             [-1, 0, 0], [x3,y2,z1],
                             [ 0,-1, 0], [x2,y3,z1]);
                    this.corner(x3, y3,  1,  1);
                }
            }
        }
    }
};

Maze.prototype.build_floors = function() {
    for (var y = 0; y < this.h; y++) {
        for (var x = 0; x < this.w; x++) {
            var l = this.vert[y][x];
            var r = this.vert[y][x+1];
            var b = this.horz[y][x];
            var t = this.horz[y+1][x];
            var x0 = x;
            var x1 = x + 1;
            var y0 = y;
            var y1 = y + 1;
            var z0 = 0;
            if (l) x0 += this.offset;
            if (r) x1 -= this.offset;
            if (b) y0 += this.offset;
            if (t) y0 -= this.offset;
            this.quad([ 0, 0, 1], [x0,y0,z0],[x1,y0,z0],[x1,y1,z0],[x0,y1,z0]);
        }
    }
};

Maze.prototype.build = function() {
    this.faces = [];
    this.walls_h = [];
    this.walls_v = [];
    this.corners = [];

    this.build_horz();
    this.build_vert();
    this.build_joins();
    this.build_floors();
};

Maze.prototype.collate = function()
{
    var gl = this.view.ctx;

    var vertices_map = {};
    var num_vertices = 0;
    var faces = [];
    for (var fi in this.faces) {
        var vertices = this.faces[fi];
        var face = [];
        for (var vi in vertices) {
            var nv = vertices[vi];
            var normal = nv[0];
            var vertex = nv[1];
            vertex = Vector_copy(vertex);
            Vector_multiply(vertex, 100);
            Vector_floor(vertex);
            var key = [normal, vertex];
            var idx;
            if (key in vertices_map)
                idx = vertices_map[key][0];
            else {
                idx = num_vertices++;
                vertices_map[key] = [idx, normal, vertex];
            }
            face.push(idx);
        }
        faces.push(face);
    }
    var n = vertices_map.length;
    this.vertices = new Array;
    this.normals  = new Array;
    for (var nv in vertices_map) {
        var val = vertices_map[nv];
        var index = val[0];
        var normal = val[1];
        var vertex = val[2];
        this.vertices[index] = vertex;
        this.normals[index] = normal;
    }

    for (var i = 0; i < this.vertices.length; i++)
        Vector_divide(this.vertices[i], 100);

    this.indices = new Uint16Array(Array2D_flat(faces));
    this.vertices = new Float32Array(Array2D_flat(this.vertices));
    this.normals = new Float32Array(Array2D_flat(this.normals));

};

Maze.prototype.construct = function() {
    this.setup();
    this.generate(0, 0);
    this.grid = null;

    this.build();
    this.horz = null;
    this.vert = null;

    this.collate();
    this.faces = null;
};

Maze.prototype.make = function()
{
    var gl = this.view.ctx;

    this.vertex_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertex_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    this.normal_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.normal_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.normals, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    this.index_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.index_buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
};

Maze.prototype.collision_horz = function(x0, y0, x1, y1, r, prev) {
    var result = prev[0];
    var direction = prev[1];

    for (var wi in this.walls_h) {
        var wall = this.walls_h[wi];
        var y = wall[0];
        var dy = wall[1];
        var xa = wall[2];
        var xb = wall[3];

        if (Math.abs(y1 - y0) < 1e-20)
            break;
        if (x0 < xa - r && x1 < xa - r)
            continue;
        if (x0 > xb + r && x1 > xb + r)
            continue;
        if (y0 > y + r && y1 > y + r)
            continue;
        if (y0 < y - r && y1 < y - r)
            continue;

        var t;
        if (dy > 0) {
            if (y1 > y0)
                continue;
            t = (y0 - (y + r)) / (y0 - y1);
        }
        else {
            if (y1 < y0)
                continue;
            t = ((y - r) - y0) / (y1 - y0);
        }

        if (t > result)
            continue;
        if (t < 0)
            continue;
        var tx = x0 + (x1 - x0) * t;
        if (tx < xa || tx >= xb)
            continue;
        result = t;
        direction = [0, dy];
    }

    return [result, direction];
};

Maze.prototype.collision_vert = function(x0, y0, x1, y1, r, prev) {
    var result = prev[0];
    var direction = prev[1];

    for (var wi in this.walls_v) {
        var wall = this.walls_v[wi];
        var x = wall[0];
        var dx = wall[1];
        var ya = wall[2];
        var yb = wall[3];

        if (Math.abs(x1 - x0) < 1e-20)
            break;
        if (y0 < ya - r && y1 < ya - r)
            continue;
        if (y0 > yb + r && y1 > yb + r)
            continue;
        if (x0 > x + r && x1 > x + r)
            continue;
        if (x0 < x - r && x1 < x - r)
            continue;

        var t;
        if (dx > 0) {
            if (x1 > x0)
                continue;
            t = (x0 - (x + r)) / (x0 - x1);
        }
        else {
            if (x1 < x0)
                continue;
            t = ((x - r) - x0) / (x1 - x0);
        }

        if (t > result)
            continue;
        if (t < 0)
            continue;
        var ty = y0 + (y1 - y0) * t;
        if (ty < ya || ty >= yb)
            continue;
        result = t;
        direction = [dx, 0];
    }

    return [result, direction];
};

Maze.prototype.collision_corner = function(x0, y0, x1, y1, r, prev) {
    var result = prev[0];
    var direction = prev[1];

    for (var ci in this.corners) {
        var c = this.corners[ci];
        var x = c[0];
        var y = c[1];
        var dx = c[2];
        var dy = c[3];

        var dx = x - x0;
        var dy = y - y0;
        var vx = x1 - x0;
        var vy = y1 - y0;
        var nx = vy;
        var ny = -vx;
        var l = Math.sqrt(nx * nx + ny * ny);
        if (l <= 0)
            continue;
        var d = Math.abs(dx * nx + dy * ny) / l;
        if (d >= r)
            continue;

        var a = vy * vy + vx * vx;
        var b = -2 * (vy * dy + vx * dx);
        var c = dx * dx + dy * dy - r * r;
        var det = b * b - 4 * a * c;
        if (det < 0)
            continue;
        var t0 = (-b + Math.sqrt(det)) / (2 * a);
        var t1 = (-b - Math.sqrt(det)) / (2 * a);
        var t = Math.min(t0, t1);
        if (t <= 0 || t >= 1)
            continue;

        if (t > result)
            continue;

        var cx = x0 + t * dx;
        var cy = y0 + t * dy;
        var rx = cx - x;
        var ry = cy - y;
        var l = Math.sqrt(rx * rx + ry * ry);
        var rx = rx / l;
        var ry = ry / l;

        result = t;
        direction = [rx, ry];
    }

    return [result, direction];
};

Maze.prototype.collision = function(x0, y0, x1, y1, r) {
    var result = [1.0, null];

    if (x0 == x1 && y0 == y1)
        return result;

    result = this.collision_horz(x0, y0, x1, y1, r, result);
    result = this.collision_vert(x0, y0, x1, y1, r, result);
    result = this.collision_corner(x0, y0, x1, y1, r, result);

    return result;
};

Maze.prototype.matrix = function() {
    var s = 2.0 / Math.sqrt(this.w * this.h);
    var m = Matrix.identity()
    m.postmultiply(Matrix.translate(-1, -1, 0));
    m.postmultiply(Matrix.scale(s, s, s));
    return m;
};

Maze.prototype.draw = function(m)
{
    var gl = this.view.ctx;

    m.postmultiply(this.matrix());
    gl.uniformMatrix4fv(gl.getUniformLocation(this.view.program, 'mv_matrix'), false, new Float32Array(m.as_array()));

    this.view.check_error();

    gl.uniform4fv(gl.getUniformLocation(this.view.program, 'material_emission'),  new Float32Array(this.emission));
    gl.uniform4fv(gl.getUniformLocation(this.view.program, 'material_ambient'),   new Float32Array(this.ambient));
    gl.uniform4fv(gl.getUniformLocation(this.view.program, 'material_diffuse'),   new Float32Array(this.diffuse));
    gl.uniform4fv(gl.getUniformLocation(this.view.program, 'material_specular'),  new Float32Array(this.specular));
    gl.uniform1f(gl.getUniformLocation(this.view.program, 'material_shininess'), this.shininess);

    this.view.check_error();

    var vertex_attrib = gl.getAttribLocation(this.view.program, "a_Position");
    var normal_attrib = gl.getAttribLocation(this.view.program, "a_Normal");

    this.view.check_error();

    gl.enableVertexAttribArray(vertex_attrib);
    gl.enableVertexAttribArray(normal_attrib);

    this.view.check_error();

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertex_buffer);
    gl.vertexAttribPointer(vertex_attrib, 3, gl.FLOAT, false, 0, 0);

    this.view.check_error();

    gl.bindBuffer(gl.ARRAY_BUFFER, this.normal_buffer);
    gl.vertexAttribPointer(normal_attrib, 3, gl.FLOAT, false, 0, 0);

    this.view.check_error();

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.index_buffer);

    this.view.check_error();

    gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);

    this.view.check_error();

    this.ball.draw(m);

    this.view.check_error();
};

