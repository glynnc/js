precision mediump float;

uniform mat4 mview;
uniform mat4 mproj;
uniform mat3 mnorm;
uniform mat4 mshadow
;
uniform vec3 light_pos;

attribute vec4 a_position;
attribute vec3 a_normal;

varying vec4 spos;
varying vec3 eye_dir;
varying vec3 light_dir;
varying vec3 normal;

void main()
{
    vec4 pos = mview * a_position;
    normal = mnorm * a_normal;
    spos = mshadow * a_position;
    vec3 tpos = pos.xyz;
    eye_dir = -tpos;
    light_dir = light_pos - tpos;
    gl_Position = mproj * pos;
}
