
precision mediump float;

uniform mat4 matrix;

attribute vec2 a_texcoord;
attribute vec3 a_normal;
attribute vec4 a_position;

varying vec2 texcoord;
varying vec3 normal;

void main()
{
    texcoord = a_texcoord;
    normal = a_normal;
    gl_Position = matrix * a_position;
}

