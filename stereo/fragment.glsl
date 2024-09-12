precision mediump float;

uniform samplerCube cubemap;
uniform mat4 matrix;
uniform float scale;

varying vec2 texcoord;

void main()
{
    vec2 t = texcoord * scale;
    float k = dot(t, t);
    vec3 p = vec3(2.0 * t, k - 1.0) / (k + 1.0);
    vec4 tc = matrix * vec4(p,1);
    vec3 v = tc.xyz / tc.w;
    gl_FragColor = textureCube(cubemap, v);
}
