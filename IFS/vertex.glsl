precision mediump float;

uniform mat4 matrix;

attribute vec4 a_position;
attribute vec2 a_texcoord;

varying vec2 texcoord;

void main()
{
    texcoord = a_texcoord;
    gl_Position = matrix * a_position;
}
