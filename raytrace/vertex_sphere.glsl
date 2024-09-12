precision mediump float;

uniform mat4 matrix;

attribute vec4 vertex;

varying vec4 p0;
varying vec4 p1;

void main()
{
    p0 = matrix * vec4(0, 0, 0, 1);
    p1 = matrix * vertex;
    gl_Position = vertex;
}
