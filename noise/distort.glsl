
uniform sampler2D texture;

void main()
{
    vec2 x = noise2(texco);
    vec2 uv = texco + x * scale;
    gl_FragColor = texture2D(texture, uv * float(repeat));
}
