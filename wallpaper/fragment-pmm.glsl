precision mediump float;
uniform sampler2D texture;
uniform mat3 tex_mat;

varying vec2 texco;

#define u uv[0]
#define v uv[1]
#define i ij[0]
#define j ij[1]

#define bit(x) (mod(x, 2.0) >= 1.0)

void main()
{
    vec2 uv = fract(texco);
    vec2 ij = texco;
    if (bit(i))
        u = 1.0-u;
    if (bit(j))
        v = 1.0-v;
    gl_FragColor = texture2D(texture, fract(tex_mat*vec3(uv,1)).st);
}
