#define MAX_POINTS 16

precision mediump float;

uniform sampler2D texture;
uniform vec2 points[MAX_POINTS];
uniform float s2[MAX_POINTS];
uniform vec2 w[MAX_POINTS];
uniform int npoints;
uniform int warp;

varying vec2 texco;

void main()
{
    if (warp > 0) {
	vec2 p = texco * 2.0 - 1.0;
	vec2 q = vec2(0, 0);
	for (int i = 0; i < MAX_POINTS; i++) {
	    if (i >= npoints)
		continue;
	    vec2 points_i = points[i];
	    float s2_i = s2[i];
	    vec2 w_i = w[i];
	    vec2 delta = p - points_i;
	    float distsq = dot(delta, delta);
	    float H_i = sqrt(distsq + s2_i);
	    q += H_i * w_i;
	}
	gl_FragColor = texture2D(texture, (q + 1.0) / 2.0);
    }
    else
	gl_FragColor = texture2D(texture, texco);
}
