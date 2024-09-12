precision mediump float;

const float pi = 3.141592653589793;

uniform bool env;
uniform sampler2D env_map;

uniform vec3 light_position;
uniform vec4 light_ambient;
uniform vec4 light_diffuse;
uniform vec4 light_specular;

uniform vec4 material_emission;
uniform vec4 material_ambient;
uniform vec4 material_diffuse;
uniform vec4 material_specular;
uniform float material_shininess;

varying vec4 p;
varying vec3 v;
varying vec3 normal;
varying vec3 pole;
varying vec3 prime;

void main()
{
    vec3 N = normalize(normal);
    vec3 E = normalize(-v);
    vec3 L = normalize(light_position.xyz - v);
    vec3 R = reflect(-L, N);

    vec4 emission = material_emission;

    vec4 ambient = material_ambient * light_ambient;

    float kd = max(dot(N, L), 0.0);
    vec4 diffuse = material_diffuse * light_diffuse * kd;

    float ks = pow(max(dot(R, E), 0.0), 0.3 * material_shininess);
    vec4 specular = material_specular * light_specular * ks;

    vec4 color = emission + ambient + diffuse + specular;

    if (env) {
        vec3 T = reflect(-E, N);
        vec3 TY = normalize(pole);
        vec3 TX = normalize(cross(TY,prime));
        vec3 TZ = normalize(cross(TX,TY));
        float v = 0.5 + asin(dot(T, TY)) / pi;
        float u = (1.0 + atan(dot(T, TX), dot(T, TZ)) / pi) / 2.0;
        vec4 tex = texture2D(env_map, vec2(u,v));
        tex.xyz *= pow(length(tex.xyz) / 1.732, 4.0);
        tex.xyz /= 3.0;
        color += material_specular * tex;
    }

    gl_FragColor = color;
}
