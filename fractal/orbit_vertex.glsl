precision mediump float;
attribute vec2 a_Position;

uniform mat4 matrix;

void main()
{
    gl_Position = matrix * vec4(a_Position, 0, 1);
}
