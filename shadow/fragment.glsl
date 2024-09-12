precision mediump float;

uniform vec3 ambient;
uniform vec3 diffuse;
uniform vec3 specular;
uniform float shininess;

uniform sampler2D depth_map;

varying vec4 spos;
varying vec3 eye_dir;
varying vec3 light_dir;
varying vec3 normal;

void main()
{
    vec3 N = normalize(normal);
    vec3 L = normalize(light_dir);
    vec3 E = normalize(eye_dir);
    vec3 R = reflect(-L, N);

    vec3 t = spos.xyz / spos.w;
    t = (t + 1.0) / 2.0;
    float depth = texture2D(depth_map, t.xy).r;
    float k = 1.0 - 0.7 * smoothstep(depth, depth + 0.01, t.z);

    float kd = max(dot(N, L), 0.0);
    float ks = pow(max(dot(R, E), 0.0), shininess);
    vec3 color = ambient + (diffuse * kd + specular * ks) * k;

    gl_FragColor = vec4(color, 1);
}
