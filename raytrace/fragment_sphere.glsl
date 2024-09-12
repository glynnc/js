//precision mediump float;

uniform float radius;
uniform vec4 center;
uniform int mode;

varying vec4 p0;
varying vec4 p1;

vec4 background(vec3 v0, vec3 dv);

bool sphere(out float t, vec3 center, float radius, vec3 v0, vec3 dv)
{
    vec3 du = v0 - center;
    float a = dot(dv, dv);
    float b = -dot(du, dv);
    float c = dot(du, du) - radius;
    float det = b*b - a*c;
    if (det < 0.0)
        return false;

    float rdet = sqrt(det);
    t = (b - rdet)/a;
    if (t > 0.1)
        return true;

    t = (b + rdet)/a;
    return (t > 0.0);
}

void main()
{
    vec3 v0 = p0.xyz / p0.w;
    vec3 v1 = p1.xyz / p1.w;
    vec3 dv = v1 - v0;

    vec3 c0 = center.xyz / center.w;
    float t;
    if (sphere(t, c0, radius, v0, dv)) {
        vec3 I = t * dv;
        v0 += I;
        vec3 N = normalize(v0 - c0);
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
            dv = refract(normalize(I), N, 1.0/1.5);
            if (sphere(t, c0, radius, v0, dv)) {
                vec3 I = t * dv;
                v0 += I;
                vec3 N = -normalize(v0 - c0);
                dv = refract(normalize(I), N, 1.5/1.0);
            }
        }
    }
    gl_FragColor = background(v0, dv);
}
