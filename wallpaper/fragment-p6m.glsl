precision mediump float;
uniform sampler2D texture;
uniform mat3 tex_mat;

varying vec2 texco;

#define u uv[0]
#define v uv[1]
#define i ij[0]
#define j ij[1]
#define s st[0]
#define t st[1]

const float rt3 = 1.732050807568877;

void main()
{
    vec2 tc = mat2(1.0,0.0,-1.0/rt3,2.0/rt3) * texco.ts;
    vec2 uv = fract(tc);
    vec2 ij = floor(tc);
    int which = int(mod(i-j,3.0));
    if (which == 0) {
        // pass
    }
    else if (which == 1) {
        if (u+v < 1.0) {
            v = u + v;
            u = 1.0 - u;
        }
        else {
            u = 2.0 - u - v;
        }
    }
    else /* which == 2 */ {
        if (u+v < 1.0) {
            u = 1.0 - u - v;
        }
        else {
            v = 2.0 - u - v;
        }
    }
    uv = abs(vec2(u-v,u+v-1.0));
    gl_FragColor = texture2D(texture, fract(fract(tex_mat*vec3(uv,1)).st));
}
