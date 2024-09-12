#extension GL_OES_standard_derivatives : enable

precision highp float;

uniform vec4 background;
uniform vec4 diffuse;
uniform vec2 width;
const float n = 10.0;

varying vec2 texcoord;

void main()
{
    vec2 p = texcoord;
    vec2 X = dFdx(p);
    vec2 Y = dFdy(p);
    vec2 k = floor(n * p + 0.5) / n;
    vec2 d = abs(p - k);
    float ds = abs(d.s / sqrt(X.s*X.s+Y.s*Y.s));
    float dt = abs(d.t / sqrt(X.t*X.t+Y.t*Y.t));
    float dm = min(ds, dt);
    //vec2 ds = abs(d.s / vec2(X.s,Y.s));
    //vec2 dt = abs(d.t / vec2(X.t,Y.t));
    //float dm = min(min(ds.x, ds.y), min(dt.x, dt.y));
    //float dm = min(ds.x+ds.y, dt.x+dt.y);
    //float t = clamp(width.x - dm, 0.0, 1.0);
    float t = 1.0 - smoothstep(width.x, width.y, dm);
    //float t = clamp((width.y - dm)/(width.y - width.x), 0.0, 1.0);

    gl_FragColor = mix(background, diffuse, t);
}
