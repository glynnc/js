precision highp float;

attribute float a_param;

uniform mat4 matrix;
uniform vec3 frequency;
uniform vec3 phase;

const float twopi = 6.283185307179586;

void main()
{
    vec3 angle = (a_param * frequency + phase) * twopi;
    vec4 pos = vec4(sin(angle.x), sin(angle.y), sin(angle.z), 1);
    gl_Position = matrix * pos;
}
