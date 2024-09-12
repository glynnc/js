precision mediump float;

uniform vec3 color;
uniform vec3 light_pos;
uniform float shininess;

varying vec3 normal;
varying vec3 position;

void main()
{
    vec3 L = normalize(light_pos - position);
    vec3 N = normalize(normal);
    vec3 E = normalize(-position);
    vec3 R = reflect(-L, N);
    float kd = max(dot(N, L), 0.0) * 0.5;
    float ks = pow(max(dot(R, E), 0.0), shininess) * 0.5;
    float ka = 0.2;
    gl_FragColor = vec4((kd + ka) * color + ks * vec3(1,1,1), 1.0);
}
