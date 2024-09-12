precision mediump float;

attribute vec4 a_position;

varying vec2 position;

void main()
{
    position = a_position.xy;
    gl_Position = a_position;
}
