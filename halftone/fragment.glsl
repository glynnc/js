precision mediump float;

uniform sampler2D halftone;
uniform vec2 size;
uniform vec4 background;
uniform float hardness;
uniform bool texco;
uniform vec3 light_pos;
uniform vec4 diffuse;

varying vec3 position;
varying vec3 normal;
varying vec2 texcoord;

void main()
{
    vec3 N = normalize(normal);
    vec3 L = normalize(light_pos - position);
    vec2 uv = (texco ? texcoord * 1000.0 : gl_FragCoord.xy) / size;

    float kd = max(dot(N, L), 0.0);
    float kt = texture2D(halftone, uv).x;
    float k = smoothstep(-hardness, hardness, kd - kt);

    gl_FragColor = background * (1.0 - k) +  diffuse * k;
}
