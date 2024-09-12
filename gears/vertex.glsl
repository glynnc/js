precision mediump float;

attribute vec4 a_position;
attribute vec3 a_normal;

uniform mat4 modelview_matrix;
uniform mat4 projection_matrix;
uniform mat3 normal_matrix;

varying vec3 normal;
varying vec3 position;

void main()
{
    vec4 tpos = modelview_matrix * a_position;
    gl_Position = projection_matrix * tpos;
    position = tpos.xyz;
    normal = normal_matrix * a_normal;
}
