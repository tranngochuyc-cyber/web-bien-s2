export function seabedHeight(x, z) {
  const ridge = 1.05 * Math.exp(-((x - 17) ** 2 / 310 + (z + 21) ** 2 / 240));
  const hollow = .62 * Math.exp(-((x + 7) ** 2 / 190 + (z + 7) ** 2 / 160));
  return -20.5 + Math.sin(x * .17) * Math.cos(z * .12) * .52
    + Math.sin(z * .29 + x * .08) * .27 + ridge - hollow;
}
