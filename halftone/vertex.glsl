precision mediump float;

attribute vec4 a_position;
attribute vec3 a_normal;
attribute vec2 a_texcoord;

uniform mat4 modelview_matrix;
uniform mat4 projection_matrix;
uniform mat3 normal_matrix;

varying vec3 position;
varying vec3 normal;
varying vec2 texcoord;

void main()
{
    vec4 tpos = modelview_matrix * a_position;
    position = tpos.xyz;
    normal = normalize(normal_matrix * a_normal);
    texcoord = a_texcoord;
    gl_Position = projection_matrix * tpos;
}
