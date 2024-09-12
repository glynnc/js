precision mediump float;

uniform sampler2D texture;

varying vec2 texco;

void main()
{
    gl_FragColor = vec4(texture2D(texture, texco).rgb, 1.0);
}
