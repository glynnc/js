precision mediump float;
attribute vec2 a_Position;
attribute vec2 a_TexCoord;

uniform mat3 matrix;

varying vec2 texco;

void main()
{
    texco = (matrix * vec3(a_TexCoord, 1)).st;
    gl_Position = vec4(a_Position, 0, 1);
}
