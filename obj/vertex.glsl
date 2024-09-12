precision mediump float;

attribute vec4 a_Position;
attribute vec3 a_Normal;
attribute vec2 a_TexCoord;
attribute vec3 a_Tangent;

uniform mat4 modelview_matrix;
uniform mat4 projection_matrix;
uniform mat3 normal_matrix;
uniform vec3 light_position;

varying vec3 light_dir;
varying vec3 eye_dir;
varying vec2 texcoord;
varying vec3 pole;
varying vec3 prime;

void main()
{
    gl_Position = projection_matrix * modelview_matrix * a_Position;
    texcoord = a_TexCoord;

    vec3 tpos = (modelview_matrix * a_Position).xyz;
    vec3 N = normalize(normal_matrix * a_Normal);
    vec3 T = normalize((modelview_matrix * vec4(a_Tangent,0)).xyz);
    vec3 B = normalize(cross(N, T));

    mat3 m = mat3(T.x, B.x, N.x,
		  T.y, B.y, N.y,
		  T.z, B.z, N.z);

    light_dir = m * (light_position - tpos);
    eye_dir = m * (-tpos);
    pole = m[1];
    prime = m[2];
}
