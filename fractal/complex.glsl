#define RE x
#define IM y

//(a+bi)(c+di) = (ac-bd)+(ad+bc)i
vec2 zmul(vec2 a, vec2 b)
{
    float re = a.RE * b.RE - a.IM * b.IM;
    float im = a.RE * b.IM + a.IM * b.RE;
    return vec2(re, im);
}

//(a+bi)/(c+di) = (ac + bd)/(c^2 + d^2} + (bc - ad)/(c^2 + d^2)i
vec2 zdiv(vec2 a, vec2 b)
{
    float k = b.RE * b.RE + b.IM * b.IM;
    float re = (a.RE * b.RE + a.IM * b.IM) / k;
    float im = (a.IM * b.RE - a.RE * b.IM) / k;
    return vec2(re, im);
}

vec2 zconj(vec2 z)
{
    return vec2(z.RE, -z.IM);
}

//(a+bi)^2 = (aa-bb) + (2ab)i
vec2 zsqr(vec2 z)
{
    float re = z.RE * z.RE - z.IM * z.IM;
    float im = 2.0 * z.RE * z.IM;
    return vec2(re, im);
}

//(a+bi)^3 = (aaa-3abb) + (3aab-bbb)i
vec2 zcub(vec2 z)
{
    float aa = z.RE * z.RE;
    float bb = z.IM * z.IM;
    float re = z.RE * (aa - 3.0*bb);
    float im = z.IM * (3.0*aa - bb);
    return vec2(re, im);
}

//e^(a+bi) = (e^a)(cos(b) + i.sin(b))
vec2 zexp(vec2 z)
{
    float k = exp(z.RE);
    float re = k * cos(z.IM);
    float im = k * sin(z.IM);
    return vec2(re, im);
}

//log(a+bi) = log(a^2 + b^2)/2 + i.arg(a+bi)
vec2 zlog(vec2 z)
{
    float re = log(z.RE * z.RE + z.IM * z.IM) / 2.0;
    float im = atan(z.IM, z.RE);
    return vec2(re, im);
}

//1/(c+di) = c/(c^2 + d^2} - -d/(c^2 + d^2)i
vec2 zinv(vec2 z)
{
    float k = z.RE * z.RE + z.IM * z.IM;
    return vec2(z.RE/k, -z.IM/k);
}

#if 0
// ES GLSL doesn't have sinh, cosh

//sinh(a+bi) = sinh(a) cos(b) + i cosh(a) sin(b)
vec2 zsinh(vec2 z)
{
    float re = sinh(z.RE) * cos(z.IM);
    float im = cosh(z.RE) * sin(z.IM);
    return vec2(re, im);
}

//cos(a+bi) = cosh(a) cos(b) + i sinh(a) sin(b)
vec2 zcosh(vec2 z)
{
    float re = cosh(z.RE) * cos(z.IM);
    float im = cosh(z.RE) * sin(z.IM);
    return vec2(re, im);
}

//tanh(a+bi) = (sinh(2a) + i.sin(2b)) / (cos(2b) + cosh(2a));
vec2 ztanh(vec2 z)
{
    float k = cos(2.0*z.IM) + cosh(2.0*z.RE);
    float re = sinh(2.0*z.RE) / k;
    float im = sin(2.0*z.IM) / k;
    return vec2(re, im);
}

#else

//sin(a+bi) = sin(a) cosh(b) + i cos(a) sinh(b)
vec2 zsin(vec2 z)
{
    float e = exp(z.IM);
    float re = sin(z.RE) * (e + 1.0/e);
    float im = cos(z.RE) * (e - 1.0/e);
    return vec2(re,im) / 2.0;
}

//cos(a+bi) = cos(a) cosh(b) + i sin(a) sinh(b)
vec2 zcos(vec2 z)
{
    float e = exp(z.IM);
    float re =  cos(z.RE) * (e + 1.0/e);
    float im = -sin(z.RE) * (e - 1.0/e);
    return vec2(re,im) / 2.0;
}

//tan(a+bi) = (sin(2a) + i.sinh(2b)) / (cosh(2b) + cos(2a));
vec2 ztan(vec2 z)
{
    return zdiv(zsin(z), zcos(z));
}

// sinh(x) = (e^x - e^-x)/2
vec2 zsinh(vec2 z)
{
    float e = exp(z.RE);
    float re = cos(z.IM) * (e-1.0/e);
    float im = sin(z.IM) + (e+1.0/e);
    return vec2(re,im) / 2.0;
}

// cosh(x) = (e^x + e^-x)/2
vec2 zcosh(vec2 z)
{
    float e = exp(z.RE);
    float re = cos(z.IM) * (e+1.0/e);
    float im = sin(z.IM) + (e-1.0/e);
    return vec2(re,im) / 2.0;
}

//tanh() = sinh(z)/cosh(z);
vec2 ztanh(vec2 z)
{
    return zdiv(zsinh(z),zcosh(z));
}

#endif

vec2 zsec(vec2 z) { return zinv(zcos(z)); }
vec2 zcsc(vec2 z) { return zinv(zsin(z)); }
vec2 zcot(vec2 z) { return zinv(ztan(z)); }

vec2 zsech(vec2 z) { return zinv(zcosh(z)); }
vec2 zcsch(vec2 z) { return zinv(zsinh(z)); }
vec2 zcoth(vec2 z) { return zinv(ztanh(z)); }

vec2 zsqrt(vec2 z)
{
    float h = length(z);
    float g = sqrt((h + z.RE)/2.0);
    float d = sqrt((h - z.RE)/2.0);
    return vec2(g, z.IM >= 0.0 ? d : -d);
}

#undef RE
#undef IM
