
void main()
{
    float x = 0.5 * (noise2(texco).r + 1.0);

    if (shade) {
        float dx = dFdx(x);
        float dy = dFdy(x);
        vec3 n = vec3(dx,dy,7.0*pow(0.5, float(levels[1])));
        x = dot(n, light) / length(n);
    }

    gl_FragColor = vec4(x,x,x,1.0);
}
