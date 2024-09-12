precision mediump float;

attribute float a_angle;

uniform float r0;
uniform float r1;
uniform float ratio;
uniform vec2 origin;

void main()
{
    float a0 = a_angle;
    float a1 = a0 * ratio;
    vec2 v0 = r0 * vec2(sin(a0), cos(a0));
    vec2 v1 = r1 * vec2(sin(a1), cos(a1));
    gl_Position = vec4(origin + v0 + v1, 0, 1);
}
