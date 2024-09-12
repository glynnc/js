#extension GL_EXT_shader_texture_lod : enable
#extension GL_OES_standard_derivatives : enable

precision mediump float;

uniform sampler2D random;
uniform ivec2 levels;
uniform float exponent;
uniform vec2 offset;
uniform vec2 scale;
uniform float grainy;
uniform float frequency;
uniform float stretch;
uniform vec3 color;
uniform int level;
uniform vec2 size;
uniform bool shade;
uniform vec3 light;
uniform int repeat;

varying vec2 texco;

vec2 noise2(vec2 tc)
{
    vec2 x = vec2(0.0, 0.0);
    vec2 m = vec2(0.0, 0.0);
    for (int i = 0; i <= 10; i++) {
        if (i < levels[0]) continue;
        if (i > levels[1]) break;
        x += texture2DLodEXT(random, tc, float(i)).rg - 0.5;
        x *= exponent;
        m += 0.5;
        m *= exponent;
    }
    return x / m;
}
