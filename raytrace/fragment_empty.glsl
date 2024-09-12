//precision mediump float;

varying vec4 p0;
varying vec4 p1;

vec4 background(vec3 v0, vec3 dv);

void main()
{
    vec3 v0 = p0.xyz / p0.w;
    vec3 v1 = p1.xyz / p1.w;
    vec3 dv = v1 - v0;
    gl_FragColor = background(v0, dv);
}
