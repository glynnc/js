precision mediump float;

uniform samplerCube cubemap;

varying vec4 texcoord;

void main()
{
    gl_FragColor = textureCube(cubemap, texcoord.xyz);
}
