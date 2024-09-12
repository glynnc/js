precision highp float;

vec2 zmul(vec2 a, vec2 b);
vec2 zdiv(vec2 a, vec2 b);
vec2 zconj(vec2 z);

vec2 zsqr(vec2 z);
vec2 zcub(vec2 z);
vec2 zexp(vec2 z);
vec2 zlog(vec2 z);
vec2 zinv(vec2 z);

vec2 zsin(vec2 z);
vec2 zcos(vec2 z);
vec2 ztan(vec2 z);
vec2 zsec(vec2 z);
vec2 zcsc(vec2 z);
vec2 zcot(vec2 z);

vec2 zsinh(vec2 z);
vec2 zcosh(vec2 z);
vec2 ztanh(vec2 z);
vec2 zsech(vec2 z);
vec2 zcsch(vec2 z);
vec2 zcoth(vec2 z);

float s_sqrt  (int i, vec2 z);
float s_linear(int i, vec2 z);
float s_bands (int i, vec2 z);
float s_2bands(int i, vec2 z);
float s_binary(int i, vec2 z);
float s_angle (int i, vec2 z);
float s_decomp(int i, vec2 z);
float s_factor(int i, vec2 z);
float s_const (int i, vec2 z);

uniform float bailout;
//uniform int maxiter;
uniform bool mandel;
uniform vec2 pos;
uniform bool invert;
uniform int i_style;
uniform int e_style;
uniform sampler2D i_tex;
uniform sampler2D e_tex;

varying vec2 texco;

