
const vec2 h = vec2(0.5,0.5);

vec2 get(vec2 uv)
{
    return texture2DLodEXT(random, (uv + h)/size, float(level)).zw * 2.0 - 1.0;
}

void main()
{
    vec2 uv = texco * size;
    vec2 ij = floor(uv);
    vec2 i00 = ij + vec2(0.0, 0.0);
    vec2 i01 = ij + vec2(0.0, 1.0);
    vec2 i10 = ij + vec2(1.0, 0.0);
    vec2 i11 = ij + vec2(1.0, 1.0);
    vec2 x00 = get(i00);
    vec2 x01 = get(i01);
    vec2 x10 = get(i10);
    vec2 x11 = get(i11);
    vec2 d00 = uv - i00;
    vec2 d01 = uv - i01;
    vec2 d10 = uv - i10;
    vec2 d11 = uv - i11;
    float k00 = dot(x00, d00);
    float k01 = dot(x01, d01);
    float k10 = dot(x10, d10);
    float k11 = dot(x11, d11);
    float u = smoothstep(0.0, 1.0, d00.x);
    float v = smoothstep(0.0, 1.0, d00.y);
    float k0 = mix(k00,k10,u);
    float k1 = mix(k01,k11,u);
    float k = mix(k0,k1,v);
    k /= 1.414213562373095;
    k += 1.0;
    k /= 2.0;

    if (shade) {
        float dx = dFdx(k);
        float dy = dFdy(k);
        vec3 n = vec3(dx,dy,3.0*pow(0.5, float(level)));
        k = dot(n, light) / length(n);
    }

    gl_FragColor = vec4(k, k, k, 1.0);
}
