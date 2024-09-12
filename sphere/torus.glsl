precision highp float;

const float pi = 3.141592653589793;

uniform sampler2D texture;
uniform mat4 matrix;

varying vec2 position;

float quartic(float a4, float a3, float a2, float a1, float a0)
{
    float u = a3/a4;
    float v = a2/a4;
    for (int i = 0; i < 18; i++)
    {
        float b1 = a3 - u*a4;
        float b0 = a2 - u*b1 - v*a4;
        float c = a1 - u*b0 - v*b1;
        float d = a0 - v*b0;
        float g = b1 - u*a4;
        float h = b0 - v*a4;
        float k = g*g*v + h*(h-g*u);
        float du = g*d - h*c;
        float dv = (g*u-h)*d - g*v*c;
        u -= du/k;
        v -= dv/k;
    }
    // x^2 + u*x + v = 0
    float d1 = u*u - 4.0*v;
    float r1 = (d1 >= 0.0) ? (-u - sqrt(d1)) / 2.0 : 1e30;

    float b2 = a4;
    float b1 = a3 - u*b2;
    float b0 = a2 - u*b1 - v*b2;

    float d2 = b1*b1 - 4.0*b2*b0;
    float r2 = (d2 >= 0.0) ? (-b1 - sqrt(d2)) / (2.0*b2) : 1e30;

    //gl_FragColor = (d1 >= 0.0) ? ((d2 >= 0.0) ? vec4(1,0,0,1) : vec4(0,1,0,1)) : ((d2 >= 0.0) ? vec4(1,1,0,1) : vec4(0,0,1,1));
    //return 0.5;
    return min(r1,r2);
}

const float R = 0.8;
const float r = 0.2;

void main()
{
    vec4 q0 = matrix * vec4(position,-1, 1);
    vec4 q1 = matrix * vec4(position, 1, 1);
    vec3 p0 = q0.xzy / q0.w;
    vec3 p1 = q1.xzy / q1.w;
    vec3 v = p1 - p0;
    vec3 u = cross(p0, v);
    float pp = dot(p0,p0);
    float pv = dot(p0,v);
    float vv = dot(v,v);
    float uu = dot(u,u);
    float RR = R*R;
    float rr = r*r;

    float A = vv*vv;
    float B = 4.0*pv*vv;
    float C = 2.0*(2.0*RR*v.z*v.z - (RR + rr)*vv + uu + 3.0*pv*pv);
    float D = 4.0*(2.0*RR*p0.z*v.z + (pp - (RR + rr))*pv);
    float E = (RR - rr)*(RR - rr) + 4.0*RR*p0.z*p0.z + pp*(pp - 2.0*(RR + rr));

    float t = quartic(A,B,C,D,E);

    if (t < 0.0)
        discard;
    if (t > 1.0)
        discard;

    vec3 p = mix(p0, p1, t);
    float phi = asin(p.z);
    float lam = atan(p.x, p.y);
    vec2 tc = vec2((1.0 + lam / pi) / 2.0, 0.5 + phi / pi);
    vec4 fc = texture2D(texture, tc);

    gl_FragColor = fc;
}
