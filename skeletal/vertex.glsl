precision mediump float;

uniform mat4 modelview_matrix;
uniform mat3 normal_matrix;
uniform mat4 projection_matrix;
uniform mat4 bones[@NUM_BONES@];
uniform int chrome;
uniform vec4 chrome_box;

attribute vec4 a_position;
attribute vec3 a_normal;
attribute vec2 a_texcoord;
attribute float a_vertex_bone;
attribute float a_normal_bone;

varying vec4 position;
varying vec3 normal;
varying vec2 texcoord;

void main()
{
    int vertex_bone = int(a_vertex_bone);
    int normal_bone = int(a_normal_bone);
    mat4 mv = modelview_matrix * bones[vertex_bone];
    mat3 mn = normal_matrix * mat3(bones[normal_bone]);

    position = mv * a_position;
    normal = mn * a_normal;
    if (chrome != 0) {
        float nx = (1.0 + normal.x)/2.0;
        float ny = (1.0 + normal.y)/2.0;
        texcoord = vec2(chrome_box[0] + nx * chrome_box[2], chrome_box[1] + ny * chrome_box[3]);
    }
    else
        texcoord = a_texcoord;
    gl_Position = projection_matrix * position;
}
