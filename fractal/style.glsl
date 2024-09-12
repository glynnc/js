float s_sqrt(int i, vec2 z) {
    return sqrt(float(i) / float(maxiter));
}
float s_linear(int i, vec2 z) {
    return float(i) / float(maxiter);
}
float s_bands(int i, vec2 z) {
    return fract(float(i) * 0.3141);
}
float s_2bands(int i, vec2 z) {
    return fract(float(i) * 0.5);
}
float s_binary(int i, vec2 z) {
    return ((i / 2) * 2 != i) ? 0.99 : 0.0;
}
float s_angle(int i, vec2 z) {
    return 0.5 + atan(z[1], z[0]) / 6.283185307179586;
}
float s_decomp(int i, vec2 z) {
    return ((z[0] > 0.0) == (z[1] > 0.0)) ? 0.99 : 0.0;
}
float s_factor(int i, vec2 z) {
    return length(z) / bailout;
}
float s_const(int i, vec2 z) {
    return 0.0;
}
