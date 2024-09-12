
precision mediump float;

uniform mat4 proj;
uniform mat4 view;

attribute vec3 a_position;

varying vec3 texcoord;

void main()
{
    texcoord = a_position;
    gl_Position = proj * vec4(mat3(view) * a_position,1);
}
