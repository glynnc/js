#extension GL_OES_standard_derivatives : enable

precision mediump float;

uniform vec4 background;
uniform vec4 diffuse;
const float n = 10.0;

varying vec2 texcoord;

float min4(vec4 v)
{
    return min(min(v.x,v.y),min(v.z,v.w));
}

float max4(vec4 v)
{
    return max(max(v.x,v.y),max(v.z,v.w));
}

void main()
{
    vec2 p = texcoord;
    vec2 dx = dFdx(p);
    vec2 dy = dFdy(p);
    vec2 p00 = p - dy - dx;
    vec2 p01 = p - dy + dx;
    vec2 p10 = p + dy - dx;
    vec2 p11 = p + dy + dx;
    vec2 k = floor(n * p) / n;
    vec4 vs = vec4(p00.s, p01.s, p10.s, p11.s) - k.s;
    vec4 vt = vec4(p00.t, p01.t, p10.t, p11.t) - k.t;

    float vs0 = min4(vs);
    float vs1 = max4(vs);
    float vt0 = min4(vt);
    float vt1 = max4(vt);
    float t = (vs0 * vs1 <= 0.0) || (vt0 * vt1 <= 0.0) ? 1.0 : 0.0;

    gl_FragColor = mix(background, diffuse, t);
}
