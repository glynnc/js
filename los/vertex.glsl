precision mediump float;

attribute vec2 a_position;
attribute vec2 a_texcoord;

uniform mat4 mvp_matrix;

varying vec2 texco;

void main()
{
    mediump vec4 pos = vec4(a_position, 0, 1);
    gl_Position = mvp_matrix * pos;
    texco = a_texcoord;
}
