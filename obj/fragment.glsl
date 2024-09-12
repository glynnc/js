precision mediump float;

const float pi = 3.141592653589793;

uniform bool env;
uniform float nmap_scale;
uniform vec2 tex_scale;
uniform float gamma;

uniform sampler2D texture;
uniform sampler2D normal_map;
uniform sampler2D env_map;

uniform vec4 material_emission;
uniform vec4 material_ambient;
uniform vec4 material_diffuse;
uniform vec4 material_specular;
uniform float material_shininess;

uniform vec4 light_ambient;
uniform vec4 light_diffuse;
uniform vec4 light_specular;

varying vec2 texco;
varying float intensity;

varying vec3 light_dir;
varying vec3 eye_dir;
varying vec2 texcoord;
varying vec3 pole;
varying vec3 prime;

vec4 envmap(vec2 uv)
{
    vec4 color = texture2D(env_map, uv);
    float luma = dot(color.rgb, vec3(1,1,1)) / 3.0;
    luma = pow(luma, gamma - 1.0);
    return luma * color;
}

void main()
{
    vec3 E = normalize(eye_dir);
    vec2 texco = texcoord;
    vec3 normal = texture2D(normal_map, texco * nmap_scale * tex_scale).rgb * 2.0 - 1.0;
    vec3 N = normalize(normal);
    vec3 L = normalize(light_dir);
    vec3 R = reflect(-L, N);
    vec3 T = reflect(-E, N);
    vec3 TY = normalize(pole);
    vec3 TX = normalize(cross(TY,prime));
    vec3 TZ = normalize(cross(TX,TY));

    float kd = max(dot(N, L), 0.0);
    float ks = pow(max(dot(R, E), 0.0), material_shininess);
    float v = 0.5 + asin(dot(T, TY)) / pi;
    float u = (1.0 + atan(dot(T, TX), dot(T, TZ)) / pi) / 2.0;

    vec4 tex = texture2D(texture, texco * tex_scale);

    gl_FragColor =
        material_emission +
        material_ambient * light_ambient * tex +
        material_diffuse * light_diffuse * tex * kd +
        (env
            ? material_specular * envmap(vec2(u,v))
            : material_specular * light_specular * ks);
}
