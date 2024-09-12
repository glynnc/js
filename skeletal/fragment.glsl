precision mediump float;

uniform sampler2D texture;

varying vec4 position;
varying vec3 normal;
varying vec2 texcoord;

void main()
{
    gl_FragColor = texture2D(texture, texcoord);
}


