export function getRGB(argb: number) {
  const b = (argb) & 0xFF;
  const g = (argb >> 8) & 0xFF;
  const r = (argb >> 16) & 0xFF;
  const a = (argb >> 24) & 0xFF;
  return { r, g, b, a };
}

export function toHex(argb: number) {
  return "#" + argb.toString(16).padStart(6, "0");
}