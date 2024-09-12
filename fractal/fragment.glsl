const int maxiter = MAXITER;

#define i_func I_FUNC;
#define e_func E_FUNC;

float length2(vec2 z)
{
    return z[0] * z[0] + z[1] * z[1];
}

void main()
{
    vec2 p = texco;
    if (invert)
        p = zinv(p);
    vec2 c, z;
    if (mandel) {
        c = p;
        z = vec2(0, 0);
        z = EXPRESSION;
    }
    else {
        c = pos;
        z = p;
    }

    float bailout2 = bailout * bailout;
    int n = maxiter;
    for (int i = 0; i < maxiter; i++) {
        if (length2(z) >= bailout2) {
	    n = i;
            break;
	}
        z = EXPRESSION;
    }

#if 1
    int style = n == maxiter ? i_style : e_style;
    float k;

    if (style == 0) k = s_sqrt  (n, z);
    if (style == 1) k = s_linear(n, z);
    if (style == 2) k = s_bands (n, z);
    if (style == 3) k = s_2bands(n, z);
    if (style == 4) k = s_binary(n, z);
    if (style == 5) k = s_angle (n, z);
    if (style == 6) k = s_decomp(n, z);
    if (style == 7) k = s_factor(n, z);
    if (style == 8) k = s_const (n, z);
#else
    float k = (n == maxiter) ? i_func(n, z) : e_func(n, z);
#endif

#if 0
    gl_FragColor = vec4(k,k,k,1);
#else
    gl_FragColor = n == maxiter
	 ? texture2D(i_tex, vec2(k,0))
	 : texture2D(e_tex, vec2(k,0));
#endif
}
