
precision highp float;

uniform mat4 matrix;

attribute vec4 a_position;

void main()
{
    gl_Position = matrix * a_position;
}

