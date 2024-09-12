precision highp float;

const float pi = 3.141592653589793;

uniform sampler2D texture;
uniform mat4 matrix;

varying vec2 position;

void main()
{
    vec4 q0 = matrix * vec4(position,-1, 1);
    vec4 q1 = matrix * vec4(position, 1, 1);
    vec3 p0 = q0.xzy / q0.w;
    vec3 p1 = q1.xzy / q1.w;
    vec3 v = p1 - p0;
    vec3 u = cross(p0, p1);
    float a = -dot(p0, v);
    float b = dot(v, v) - dot(u, u);
    float c = dot(v, v);
    if (b < 0.0)
        discard;
    float t = (a - sqrt(b))/c;

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

