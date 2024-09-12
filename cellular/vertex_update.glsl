precision highp float;

attribute vec2 a_texcoord;

varying vec2 texcoord;

void main()
{
    texcoord = a_texcoord;
    gl_Position = vec4(a_texcoord * 2.0 - 1.0, 0.0, 1.0);
}
