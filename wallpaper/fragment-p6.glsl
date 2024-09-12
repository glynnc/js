precision mediump float;
uniform sampler2D texture;
uniform mat3 tex_mat;

varying vec2 texco;

#define u uv[0]
#define v uv[1]
#define i ij[0]
#define j ij[1]

const float rt3 = 1.732050807568877;

void main()
{
    vec2 tc = mat2(1.0,0.0,1.0/rt3,-2.0/rt3) * texco.ts;
    vec2 uv = fract(tc);
    vec2 ij = floor(tc);
    int which = int(mod(i-j,3.0));
    if (which == 0) {
        uv = (u < v)
            ? vec2(1.0-v,u)
            : vec2(v,1.0-u);
    }
    else if (which == 1) {
        float nv = 1.0-v;
        uv = (u < nv)
            ? ((2.0*u < nv) ? vec2(u,v+u) : vec2(1.0-u,1.0-u-v))
            : ((u > 2.0*nv) ? vec2(2.0-u-v,1.0-v) : vec2(v+u-1.0,v));
    }
    else /* which == 2 */ {
        float nu = 1.0-u;
        uv = (nu > v)
            ? ((nu > 2.0*v) ? vec2(v+u,v) : vec2(1.0-u-v,1.0-v))
            : ((2.0*nu < v) ? vec2(1.0-u,2.0-u-v) : vec2(u,u+v-1.0));
    }
    gl_FragColor = texture2D(texture, fract(tex_mat*vec3(uv,1)).st);
}
