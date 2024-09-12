precision mediump float;

uniform samplerCube cubemap;

varying vec3 texcoord;

void main()
{
    gl_FragColor = textureCube(cubemap, texcoord);
}
