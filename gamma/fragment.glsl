precision highp float;

uniform sampler2D t_random;
varying vec2 texcoord;

void main()
{
    float gamma = texcoord.y;
    float k = texture2D(t_random, gl_FragCoord.xy / 16.0).r;
    //float c = (gamma < 0.0) ? texcoord.x : (k < pow(texcoord.x, gamma) ? 1.0 : 0.0);
    float c = (gamma < 0.0) ? pow(texcoord.x,1.0/-gamma) : (k < texcoord.x ? 1.0 : 0.0);
    gl_FragColor = vec4(c,c,c,1.0);
}
