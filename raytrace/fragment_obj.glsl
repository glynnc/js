//precision mediump float;

uniform int mode;

varying vec4 p0;
varying vec4 p1;
varying vec3 norm;

vec4 background(vec3 v0, vec3 dv);

void main()
{
    vec3 v0 = p0.xyz / p0.w;
    vec3 v1 = p1.xyz / p1.w;
    vec3 dv = v1 - v0;
    vec3 N = normalize(norm);
    vec3 I = dv;

    v0 = v1;

    if (mode == 0) {
        dv = reflect(I, N);
    }
    else if (mode == 1) {
        dv = refract(normalize(I), N, 1.0/1.5);
    }
    else if (mode == 2) {
        vec3 dva = reflect(I, N);
        vec3 dvb = refract(normalize(I), N, 1.0/1.5);
        vec4 ca = background(v0, dva);
        vec4 cb = background(v0, dvb);
        gl_FragColor = mix(ca, cb, pow(dot(normalize(-I), N),0.5));
        return;
    }
    else if (mode == 3) {
    }

    gl_FragColor = background(v0, dv);
}
