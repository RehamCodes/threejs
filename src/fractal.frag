precision highp float;

uniform vec2  uResolution;
uniform float uTime;

varying vec2 vUv;

// ===== your functions (ported) =====
vec3 palette(float d){
  return mix(vec3(0.2,0.7,0.9), vec3(1.0,0.0,1.0), d);
}

vec2 rotate2d(vec2 p, float a){
  float c = cos(a), s = sin(a);
  // same orientation as your Shadertoy version
  return p * mat2(c, s, -s, c);
}

float map(vec3 p){
  for (int i = 0; i < 8; ++i) {
    float t = uTime * 0.2;
    p.xz = rotate2d(p.xz, t);
    p.xy = rotate2d(p.xy, t * 1.89);
    p.xz = abs(p.xz);
    p.xz -= 0.5;
  }
  return dot(sign(p), p) / 5.0;
}

vec4 rm(vec3 ro, vec3 rd){
  float t = 0.0;
  vec3 col = vec3(0.0);
  float d = 1.0;

  // march
  for (int i = 0; i < 64; ++i) {
    vec3 p = ro + rd * t;
    d = map(p) * 0.5;
    if (d < 0.02) break;
    if (d > 100.0) break;
    col += palette(length(p) * 0.1) / (400.0 * d);
    t += d;
  }
  float alpha = 1.0 / (d * 100.0);
  return vec4(col, clamp(alpha, 0.0, 1.0));
}

void main() {
  // Shadertoy-style coords
  vec2 fragCoord = vUv * uResolution;
  vec2 uv = (fragCoord - 0.5 * uResolution) / uResolution.x;

  // camera
  vec3 ro = vec3(0.0, 0.0, -50.0);
  ro.xz = rotate2d(ro.xz, uTime);
  vec3 cf = normalize(-ro);
  vec3 cs = normalize(cross(cf, vec3(0.0, 1.0, 0.0)));
  vec3 cu = normalize(cross(cs, cf));

  vec3 uuv = ro + cf * 3.0 + uv.x * cs + uv.y * cu;
  vec3 rd  = normalize(uuv - ro);

  vec4 col = rm(ro, rd);

  // Optional: purple-ish background blend (comment out if not needed)
  vec3 bg = mix(vec3(0.02, 0.00, 0.03), vec3(0.12, 0.04, 0.18),
                smoothstep(-0.2, 0.8, uv.x));
  vec3 outRGB = mix(bg, col.rgb, clamp(col.a * 1.8, 0.0, 1.0));

  gl_FragColor = vec4(outRGB, 1.0);
}
