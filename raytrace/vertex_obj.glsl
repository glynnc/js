precision mediump float;

uniform mat4 mview;
uniform mat4 mproj;
uniform vec4 camera;
uniform vec4 object;

attribute vec4 vertex;
attribute vec3 normal;

varying vec4 p0;
varying vec4 p1;
varying vec3 norm;

void main()
{
    p0 = camera;
    p1 = object + vertex;
    gl_Position = mproj * mview * p1;
    norm = normal;
}
