precision mediump float;

uniform sampler2D texture;
uniform mat3 tex_mat;
uniform int count;
uniform bool mirror;

varying vec2 texco;

const float twopi = 6.283185307179586;

void main()
{
    float n = float(count);
    float a = atan(texco.y, texco.x) / twopi + 0.5;
    float r = length(texco);
    if (r > 1.0)
        discard;
    a = fract(a * n);
    if (mirror)
        a = abs(a-0.5)*2.0;
    a *= twopi / n;
    if (mirror)
        a *= 0.5;
    vec2 uv = r * vec2(cos(a), sin(a));
    gl_FragColor = texture2D(texture, (tex_mat*vec3(uv,1)).st);
}
