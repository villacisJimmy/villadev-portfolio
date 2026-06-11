type HeaderLike = { get(name: string): string | null };
export type ProxyMode = "cloudflare" | "nginx";

const IPV4 = /^(?:\d{1,3}\.){3}\d{1,3}$/;
const IPV6 = /^[0-9a-fA-F:]+$/;

function valid(ip: string): boolean {
  return IPV4.test(ip) || (IPV6.test(ip) && ip.includes(":"));
}

export function getClientIp(headers: HeaderLike, mode: ProxyMode = "nginx"): string {
  if (mode === "cloudflare") {
    const cf = headers.get("cf-connecting-ip");
    if (cf && valid(cf.trim())) return cf.trim();
  }
  const xff = headers.get("x-forwarded-for");
  if (xff) {
    const parts = xff
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const last = parts[parts.length - 1];
    if (last && valid(last)) return last;
  }
  return "unknown";
}
