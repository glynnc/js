precision mediump float;

const float pi = 3.141592653589793;

uniform sampler2D sky;
uniform sampler2D ground;
uniform vec2 size;

vec4 background(vec3 v0, vec3 dv)
{
    if (dv.y < 0.0) {
        vec2 t = v0.xz - dv.xz * (v0.y / dv.y);
        return texture2D(ground, t / size);
    }
    else {
        float horiz = length(dv.xz);
        float lat = atan(dv.y / horiz);
        float lon = atan(dv.x, dv.z);
        vec2 t = vec2(lon / (2.0*pi), 1.0 - lat / (pi/2.0));
        return texture2D(sky, t);
    }
}
