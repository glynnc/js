precision mediump float;

uniform mat4 mview;
uniform mat4 mproj;

attribute vec4 a_position;
attribute vec2 a_texcoord;

varying vec2 texcoord;

void main()
{
    texcoord = a_texcoord;
    gl_Position = mproj * mview * a_position;
}
