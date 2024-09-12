precision mediump float;

uniform sampler2D texture;
uniform int size;
uniform float delta;
uniform float shear;

varying vec2 texco;

vec2 get(vec2 uv)
{
    float sz = float(size);
    vec2 st = uv / sz;
    vec2 d = (texture2D(texture, st).xy * 2.0 - 1.0) * delta;
    uv += d;
    uv /= sz;
    uv.x -= shear * uv.y;
    return uv;
}

void main()
{
    vec2 uv = texco + vec2(texco.y * shear, 0.0);
    vec2 p = floor(uv * float(size)) + 0.5;
    vec2 p00 = get(p + vec2(-1,-1));
    vec2 p01 = get(p + vec2(-1, 0));
    vec2 p02 = get(p + vec2(-1, 1));
    vec2 p10 = get(p + vec2( 0,-1));
    vec2 p11 = get(p + vec2( 0, 0));
    vec2 p12 = get(p + vec2( 0, 1));
    vec2 p20 = get(p + vec2( 1,-1));
    vec2 p21 = get(p + vec2( 1, 0));
    vec2 p22 = get(p + vec2( 1, 1));
    float l00 = length(texco-p00);
    float l01 = length(texco-p01);
    float l02 = length(texco-p02);
    float l10 = length(texco-p10);
    float l11 = length(texco-p11);
    float l12 = length(texco-p12);
    float l20 = length(texco-p20);
    float l21 = length(texco-p21);
    float l22 = length(texco-p22);
    vec3 c0 = vec3(p01, 999.9);
    vec3 c1 = vec3(p02, 999.9);
    if (l00 < c0.z) { c1 = c0; c0 = vec3(p00, l00); } else if (l00 < c1.z) { c1 = vec3(p00, l00); }
    if (l01 < c0.z) { c1 = c0; c0 = vec3(p01, l01); } else if (l01 < c1.z) { c1 = vec3(p01, l01); }
    if (l02 < c0.z) { c1 = c0; c0 = vec3(p02, l02); } else if (l02 < c1.z) { c1 = vec3(p02, l02); }
    if (l10 < c0.z) { c1 = c0; c0 = vec3(p10, l10); } else if (l10 < c1.z) { c1 = vec3(p10, l10); }
    if (l11 < c0.z) { c1 = c0; c0 = vec3(p11, l11); } else if (l11 < c1.z) { c1 = vec3(p11, l11); }
    if (l12 < c0.z) { c1 = c0; c0 = vec3(p12, l12); } else if (l12 < c1.z) { c1 = vec3(p12, l12); }
    if (l20 < c0.z) { c1 = c0; c0 = vec3(p20, l20); } else if (l20 < c1.z) { c1 = vec3(p20, l20); }
    if (l21 < c0.z) { c1 = c0; c0 = vec3(p21, l21); } else if (l21 < c1.z) { c1 = vec3(p21, l21); }
    if (l22 < c0.z) { c1 = c0; c0 = vec3(p22, l22); } else if (l22 < c1.z) { c1 = vec3(p22, l22); }
    float k = 1.0 - 10.0 * c0.z;
    //float k = 1.0 - 20.0 * (c1.z - c0.z);
    
    gl_FragColor = vec4(c0.xy, 0.5, 1.0);
}
