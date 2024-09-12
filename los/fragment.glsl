precision mediump float;

uniform sampler2D texture;
uniform vec4 color;

varying vec2 texco;

void main()
{
    gl_FragColor = color * texture2D(texture, texco);
}
