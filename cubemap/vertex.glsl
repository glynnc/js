
precision mediump float;

uniform mat4 matrix;

attribute vec2 a_position;
attribute vec2 a_texcoord;

varying vec4 texcoord;

void main()
{
    texcoord = matrix * vec4(a_texcoord,1,-1);
    gl_Position = vec4(a_position,0,1);
}
