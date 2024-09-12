"use strict";

var maze_w = 10;
var maze_h = 10;
var accel = 5.0;
var elasticity = 0.6;

var GLMaze = function(canvas)
{
    WebGLApp.call(this, canvas);
};

GLMaze.prototype = Object.create(WebGLApp.prototype);

GLMaze.prototype.init = function()
{
    this.maze = new Maze(this, maze_w, maze_h);
    this.ball = new Ball(this, 0.5, 0.5);
    this.maze.ball = this.ball;
    this.ball.maze = this.maze;

    this.light_diffuse = [.6, .6, .6, 1];
    this.light_ambient = [.5, .5, .5, 1];
    this.light_specular  = [0.1, 0.1, 0.1, 1];

    this.start_object_rot = [0, 0, 0];
    this.start_object_pos = [0, 0, -1.5];
    this.start_light_pos  = [0.5, 0.5, 1];

    this.width = null;
    this.height = null;

    this.maze_rot = [0, 0, 0];
    this.tilt = [0, 0];
    this.do_envmap = true;
    this.env_map = null;
};

GLMaze.prototype.key_press = function(event)
{
    WebGLApp.prototype.key_press.call(this, event);

    var key = event.key.toLowerCase();

    if (key == "e")
        this.do_envmap = !this.do_envmap;
};

GLMaze.prototype.update = function(t)
{
    this.ball.update(t, this.tilt[0] * accel, this.tilt[1] * accel);
};

GLMaze.prototype.mouse_move = function(event)
{
    var x = event.clientX - this.canvas.offsetLeft;
    var y = event.clientY - this.canvas.offsetTop;
    var w = this.canvas.width;
    var h = this.canvas.height;
    var sz = Math.min(w, h);
    x = (x - w / 2) / sz;
    y = (y - h / 2) / sz;
    y = -y;
    this.tilt = [x, y];
    this.maze_rot = [-y, x, 0];
};

GLMaze.prototype.matrix = function()
{
    var m = new Matrix();
    m.postmultiply(Matrix.translate(this.object_pos));
    m.postmultiply(Matrix.rotate(10 * (Math.PI / 180) * Vector_magnitude(this.maze_rot), this.maze_rot));
    m.postmultiply(Matrix.rotx(this.object_rot[0], true));
    m.postmultiply(Matrix.roty(this.object_rot[1], true));
    m.postmultiply(Matrix.rotz(this.object_rot[2], true));
    return m;
};

GLMaze.prototype.draw = function()
{
    var gl = this.ctx;

    this.check_error();

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    this.check_error();

    gl.useProgram(this.program)

    this.check_error();
    
    var modelview_mat = this.matrix();
    var projection_mat = Matrix.perspective(this.camera_fov, this.canvas.height / this.canvas.width, 0.1, 10.0);

    gl.uniformMatrix4fv(gl.getUniformLocation(this.program, 'proj_matrix'), false, new Float32Array(projection_mat.as_array()));
    gl.uniformMatrix4fv(gl.getUniformLocation(this.program, 'mv_matrix'), false, new Float32Array(modelview_mat.as_array()));

    this.check_error();

    gl.uniform3fv(gl.getUniformLocation(this.program, 'light_position'), new Float32Array(this.light_pos));
    gl.uniform4fv(gl.getUniformLocation(this.program, 'light_ambient'),  new Float32Array(this.light_ambient));
    gl.uniform4fv(gl.getUniformLocation(this.program, 'light_diffuse'),  new Float32Array(this.light_diffuse));
    gl.uniform4fv(gl.getUniformLocation(this.program, 'light_specular'), new Float32Array(this.light_specular));

    this.check_error();

    if (!this.env_map)
	this.do_envmap = false;

    gl.uniform1i(gl.getUniformLocation(this.program, 'env'), this.do_envmap);
    if (this.do_envmap) {
        gl.uniform1i(gl.getUniformLocation(this.program, 'env_map'), 0);
        gl.bindTexture(gl.TEXTURE_2D, this.env_map);
    }

    this.check_error();

    this.maze.draw(modelview_mat);

    this.check_error();

    gl.flush();

    this.check_error();
};

GLMaze.prototype.setup_program = function()
{
    this.program = this.create_program('vshader', 'fshader');
};

GLMaze.prototype.setup = function()
{
    var gl = this.ctx;

    this.maze.construct();
    this.maze.make();
    this.ball.make();

    this.setup_program();

    this.check_error();

    gl.frontFace(gl.CCW);
    gl.enable(gl.CULL_FACE);

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    gl.clearColor(0, 0, 0, 0);

    this.check_error();

    try {
      this.env_map = this.load_texture('image');
    }
    catch (e) {
        this.env_map = null;
    }

    this.check_error();
};

var view = null;

function start()
{
    var canvas = document.getElementById("canvas");
    view = new GLMaze(canvas);
    setInterval(view.refresh.bind(view), 15);
};

