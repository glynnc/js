"use strict";

var svg_ns = "http://www.w3.org/2000/svg";

var directions = [
    [0,1,2,3],[0,1,3,2],[0,2,1,3],[0,2,3,1],[0,3,1,2],[0,3,2,1],
    [1,0,2,3],[1,0,3,2],[1,2,0,3],[1,2,3,0],[1,3,0,2],[1,3,2,0],
    [2,0,1,3],[2,0,3,1],[2,1,0,3],[2,1,3,0],[2,3,0,1],[2,3,1,0],
    [3,0,1,2],[3,0,2,1],[3,1,0,2],[3,1,2,0],[3,2,0,1],[3,2,1,0]];

var vectors = [[0,-1],[1,0],[0,1],[-1,0]];

var base;
var size = 50;
var width;
var height;
var grid;
var next = 0;
var max_dist = 0;
var max_points;

function add_line(x1, y1, x2, y2, style)
{
    var e = document.createElementNS(svg_ns, "line");
    e.setAttribute("id", "path_" + next++);
    e.setAttribute("x1", (x1+0.5)*size);
    e.setAttribute("y1", (y1+0.5)*size);
    e.setAttribute("x2", (x2+0.5)*size);
    e.setAttribute("y2", (y2+0.5)*size);
    e.setAttribute("stroke-width", 2.5);
    //e.style.setProperty("stroke-width", 2.5);
    for (var i = 0; i < style.length; i++)
	e.setAttribute(style[i][0], style[i][1]);
    //e.style.setProperty(style[i][0], style[i][1]);
    base.appendChild(e);
}

function make_maze(x, y, path)
{
    grid[y][x] = path.slice();
    var dirs = directions[Math.floor(Math.random() * 24)];
    path.push(null);
    for (var i = 0; i < 4; i++) {
	var dir = dirs[i];
	var nx = x + vectors[dir][0];
	var ny = y + vectors[dir][1];
	if (nx < 0 || nx >= width || ny < 0 || ny >= height)
	    continue;
	if (grid[ny][nx] != null)
	    continue;
	add_line(x, y, nx, ny, [["stroke", "#000040"]]);
	path[path.length-1] = dir;
	make_maze(nx, ny, path);
    }
    path.pop();
}

function prefix_length(p0, p1)
{
    var n = 0;
    for (var i = 0; i < p0.length && i < p1.length; i++) {
	if (p0[i] == p1[i])
	    n = i + 1;
	else
	    break;
    }

    return n;
}

function startup(evt)
{
    base = document.getElementById("canvas");

    var w = document.documentElement.width.baseVal.value;
    var h = document.documentElement.height.baseVal.value;

    width  = Math.floor(w / size);
    height = Math.floor(h / size);

    grid = [];
    for (var y = 0; y < height; y++) {
	var row = [];
	for (var x = 0; x < width; x++) {
	    row.push(null);
	}
	grid.push(row);
    }

    var x = Math.floor(Math.random() * width);
    var y = Math.floor(Math.random() * height);
    var path = [];
    make_maze(x, y, path);

    for (var y = 0; y < height; y++) {
	for (var x = 0; x < width; x++) {
	    var p0 = grid[y][x];
	    for (var dir = 0; dir < 4; dir++) {
		var nx = x + vectors[dir][0];
		var ny = y + vectors[dir][1];
		if (nx < 0 || nx >= width || ny < 0 || ny >= height)
		    continue;
		var p1 = grid[ny][nx];
		var dist = p0.length + p1.length - 2 * prefix_length(p0,p1);
		if (max_dist == dist) {
		    max_points.push([x,y,nx,ny]);
		}
		else if (max_dist < dist) {
		    max_dist = dist;
		    max_points = [[x,y,nx,ny]];
		}
	    }
	}
    }

    for (var i = 0; i < max_points.length; i++) {
	var point = max_points[i];
	var x = point[0];
	var y = point[1];
	var nx = point[2];
	var ny = point[3];
	add_line(x, y, nx, ny, [["stroke", "#ff0000"],
				["stroke-dasharray", [2,5]]]);
    }
}

// ab + bc + cd >= ad
// bc + cd + ad >= ab
// cd + ad + ab >= bc
// ad + ab + bc >= cd

// ab <= dc for a to rotate fully
