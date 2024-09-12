precision mediump float;

uniform vec3 l_ambient;
uniform vec3 l_diffuse;
uniform vec3 l_specular;

uniform vec3 m_specular;
uniform float m_shininess;

uniform sampler2D texture;

varying vec2 texcoord;
varying vec3 eye_dir;
varying vec3 light_dir;
varying vec3 normal;

void main()
{
    vec3 N = normalize(normal);
    vec3 L = normalize(light_dir);
    vec3 E = normalize(eye_dir);
    vec3 R = reflect(-L, N);

    vec4 m_color = texture2D(texture, texcoord);

    float kd = max(dot(N, L), 0.0);
    float ks = pow(max(dot(R, E), 0.0), m_shininess) * m_color.a;
    vec3 color = (l_ambient + l_diffuse * kd) * m_color.rgb + l_specular * m_specular * ks;

    gl_FragColor = vec4(color, 1);
}
