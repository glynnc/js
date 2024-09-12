precision highp float;

attribute vec3 a_Position;
attribute vec3 a_Normal;

uniform mat4 mv_matrix;
uniform mat4 proj_matrix;

varying vec4 p;
varying vec3 v;
varying vec3 normal;
varying vec3 pole;
varying vec3 prime;

void main()
{
    vec4 pos = vec4(a_Position, 1);
    gl_Position = proj_matrix * mv_matrix * pos;
    normal = normalize(mat3(mv_matrix) * a_Normal);
    v = (mv_matrix * pos).xyz;
    p = mv_matrix * pos;

    pole = (mv_matrix * vec4(0, 1, 0, 0)).xyz;
    prime = (mv_matrix * vec4(-1, 0, 0, 0)).xyz;
}
