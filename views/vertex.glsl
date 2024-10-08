precision highp float;

attribute vec4 a_position;
attribute vec2 a_texcoord;

uniform mat4 u_matrix;

varying vec2 texcoord;

void main()
{
    gl_Position = u_matrix * a_position;
    texcoord = a_texcoord;
}
