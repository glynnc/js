
void main()
{
    vec2 tc = texco * vec2(1.0, 1.0/stretch);
    vec2 x = noise2(tc);
    vec2 uv = vec2(texco.s - 0.5, 0.0) + x * scale + offset;
    float r = length(uv);
    float d = texture2DLodEXT(random, vec2(4.0*r,0.5), 0.0).x * 2.0 - 1.0;
    float k = 0.6 + 0.1 * sin(frequency * r) + grainy * d;

    gl_FragColor = vec4(k*color, 1.0);
}
