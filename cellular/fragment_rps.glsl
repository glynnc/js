precision highp float;

uniform sampler2D texture;
uniform vec2 tex_size;

varying vec2 texcoord;

const mat3 m_yuv = mat3(
     0.0    ,-0.81650, 0.57735,
     0.70711, 0.40825, 0.57735,
    -0.70711, 0.40825, 0.57735);

vec3 uv(vec3 rgb)
{
    vec3 yuv = m_yuv * rgb;
    return yuv / length(yuv.xy);
}

float compare(vec3 a, vec3 b)
{
    return a.x * b.y - a.y * b.x;
}

void main()
{
    vec2 d = 1.0 / tex_size;
    vec2 dx = vec2(d.x, 0.0);
    vec2 dy = vec2(0.0, d.y);

    vec3 c  = texture2D(texture, texcoord     ).rgb;
    vec3 cd = texture2D(texture, texcoord - dy).rgb;
    vec3 cu = texture2D(texture, texcoord + dy).rgb;
    vec3 cl = texture2D(texture, texcoord - dx).rgb;
    vec3 cr = texture2D(texture, texcoord + dx).rgb;

    vec3 q  = uv(c);
    vec3 qd = uv(cd);
    vec3 qu = uv(cu);
    vec3 ql = uv(cl);
    vec3 qr = uv(cr);

    if (compare(q, ql) < 0.0) { q = ql; c = cl; }
    if (compare(q, qr) < 0.0) { q = qr; c = cr; }
    if (compare(q, qd) < 0.0) { q = qd; c = cd; }
    if (compare(q, qu) < 0.0) { q = qu; c = cu; }

    gl_FragColor = vec4(c, 1.0);
}
