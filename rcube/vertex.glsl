precision mediump float;

uniform mat4 xforms[27];

uniform mat4 mview;
uniform mat4 mproj;
uniform mat3 mnorm;

uniform vec3 light_pos;

attribute vec4 a_position;
attribute vec3 a_normal;
attribute vec2 a_texcoord;
attribute float a_xform;

varying vec3 eye_dir;
varying vec3 light_dir;
varying vec3 normal;
varying vec2 texcoord;

void main()
{
    int xform = int(a_xform);
    mat4 mv = xform >= 27 ? mview : mview * xforms[xform];
    mat3 mn = xform >= 27 ? mnorm : mnorm * mat3(xforms[xform]);

    vec4 pos = mv * a_position;
    normal = mn * a_normal;
    texcoord = a_texcoord;
    vec3 tpos = pos.xyz;
    eye_dir = -tpos;
    light_dir = light_pos - tpos;
    gl_Position = mproj * pos;
}
