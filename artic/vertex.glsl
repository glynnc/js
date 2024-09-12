precision mediump float;

attribute vec2 a_pos;

uniform mat4 matrix;

void main()
{
    gl_Position = matrix * vec4(a_pos, 0, 1);
}
