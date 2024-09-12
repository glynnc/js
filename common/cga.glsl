precision mediump float;

uniform samplerCube cubemap;

varying vec4 texcoord;

#define WCM_NEAREST 1
#define WCM_CLIP 0
#define WCM_INTERP 0

#if WCM_NEAREST || WCM_CLIP || WCM_INTERP
const mat3 fwd = mat3(1, 1, 1,  0, 1, 1,  1, 0, 1);
const mat3 inv = mat3(1,-1, 0,  1, 0,-1, -1, 1, 1);
#endif

void main()
{
    vec3 v = texcoord.xyz / texcoord.w;
    vec3 rgb = textureCube(cubemap, v).rgb;
#if WCM_NEAREST || WCM_CLIP || WCM_INTERP
    vec3 wcm = inv * rgb;
#if WCM_CLIP || WCM_INTERP
    wcm = min(vec3(1,1,1), max(vec3(0,0,0), wcm));
#elif WCM_NEAREST
    wcm = dot(wcm,vec3(1,1,1)) < 0.5
        ? vec3(0,0,0)
        : wcm.x > wcm.y
            ? (wcm.x > wcm.z ? vec3(1,0,0) : vec3(0,0,1))
            : (wcm.y > wcm.z ? vec3(0,1,0) : vec3(0,0,1));
#elif WCM_INTERP
    float k = dot(wcm,vec3(1,1,1));
    if (k > 1.0) wcm /= k;
#endif
    rgb = fwd * wcm;
#endif
    gl_FragColor = vec4(rgb, 1);
}

// x>y Y--> xyz xzy zxy
//          x>z Y--> xyz xzy
//              N--> zxy
//     N--> yxz yzx zyx
//          y>z Y--> yxz yzx
//              N--> zyx
