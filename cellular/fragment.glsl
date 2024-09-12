precision mediump float;

uniform sampler2D texture;

varying vec2 texcoord;

void main()
{
    vec3 c = texture2D(texture, texcoord).rgb;
    gl_FragColor = vec4(c, 1.0);
}
