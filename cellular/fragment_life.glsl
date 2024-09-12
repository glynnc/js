precision mediump float;

uniform sampler2D texture;
uniform vec2 tex_size;

varying vec2 texcoord;

void main()
{
    vec2 d = 1.0 / tex_size;
    vec2 dx = vec2(d.x, 0.0);
    vec2 dy = vec2(0.0, d.y);
    int c00 = texture2D(texture, texcoord - dy - dx).r > 0.5 ? 1 : 0;
    int c01 = texture2D(texture, texcoord - dy     ).r > 0.5 ? 1 : 0;
    int c02 = texture2D(texture, texcoord - dy + dx).r > 0.5 ? 1 : 0;
    int c10 = texture2D(texture, texcoord      - dx).r > 0.5 ? 1 : 0;
    int c11 = texture2D(texture, texcoord          ).r > 0.5 ? 1 : 0;
    int c12 = texture2D(texture, texcoord      + dx).r > 0.5 ? 1 : 0;
    int c20 = texture2D(texture, texcoord + dy - dx).r > 0.5 ? 1 : 0;
    int c21 = texture2D(texture, texcoord + dy     ).r > 0.5 ? 1 : 0;
    int c22 = texture2D(texture, texcoord + dy + dx).r > 0.5 ? 1 : 0;
    int neighbors = c00 + c01 + c02 + c10 + 0 + c12 + c20 + c21 + c22;
    bool live = neighbors >= (c11 > 0 ? 2 : 3) && neighbors <= 3;
    gl_FragColor = vec4(live ? 1.0 : 0.0, 0.0, 0.0, 1.0);
}
