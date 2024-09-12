
void main()
{
    vec2 x = noise2(texco);
    vec2 uv = texco - 0.5 + x * scale + offset;
    float r = length(uv);
    float d = texture2DLodEXT(random, vec2(4.0*r,0.5), 0.0).x * 2.0 - 1.0;
    float k = 0.6 + 0.1 * sin(frequency * r) + grainy * d;

    gl_FragColor = vec4(k*color, 1.0);
}
