import { lookup } from "node:dns/promises";
import { BlockList, isIP } from "node:net";
import { NonRetriableError } from "inngest";
import type { PinnedAddress } from "./pinned-fetch";

export type SafeHttpTarget = {
  url: URL;
  addresses: PinnedAddress[];
};

const blockedNetworks = new BlockList();
blockedNetworks.addSubnet("0.0.0.0", 8, "ipv4");
blockedNetworks.addSubnet("10.0.0.0", 8, "ipv4");
blockedNetworks.addSubnet("100.64.0.0", 10, "ipv4");
blockedNetworks.addSubnet("127.0.0.0", 8, "ipv4");
blockedNetworks.addSubnet("169.254.0.0", 16, "ipv4");
blockedNetworks.addSubnet("172.16.0.0", 12, "ipv4");
blockedNetworks.addSubnet("192.168.0.0", 16, "ipv4");
blockedNetworks.addSubnet("224.0.0.0", 4, "ipv4");
blockedNetworks.addAddress("255.255.255.255", "ipv4");
blockedNetworks.addAddress("::", "ipv6");
blockedNetworks.addAddress("::1", "ipv6");
blockedNetworks.addSubnet("fc00::", 7, "ipv6");
blockedNetworks.addSubnet("fe80::", 10, "ipv6");

const FORBIDDEN_HEADER_NAMES = new Set([
  "connection",
  "content-length",
  "host",
  "keep-alive",
  "proxy-authorization",
  "proxy-connection",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

const BLOCKED_HOST_SUFFIXES = [".localhost", ".local", ".internal", ".lan"];
const BLOCKED_HOSTS = new Set(["localhost", "metadata.google.internal"]);

export const isBlockedHostname = (hostname: string) => {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  if (BLOCKED_HOSTS.has(host)) {
    return true;
  }

  return BLOCKED_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix));
};

export const isBlockedIpAddress = (ip: string): boolean => {
  const normalized = ip.toLowerCase();
  if (normalized.startsWith("::ffff:")) {
    const mapped = ip.slice(ip.toLowerCase().indexOf("::ffff:") + 7);
    if (isIP(mapped) === 4) {
      return isBlockedIpAddress(mapped);
    }
  }

  const version = isIP(ip);
  if (version === 4) {
    return blockedNetworks.check(ip, "ipv4");
  }
  if (version === 6) {
    return blockedNetworks.check(ip, "ipv6");
  }

  return true;
};

export const sanitizeHttpHeaders = (headers: Record<string, string>) => {
  const sanitized: Record<string, string> = {};

  for (const [key, value] of Object.entries(headers)) {
    if (FORBIDDEN_HEADER_NAMES.has(key.toLowerCase())) {
      continue;
    }
    if (/[\r\n]/.test(key) || /[\r\n]/.test(value)) {
      continue;
    }
    sanitized[key] = value;
  }

  return sanitized;
};

export const assertSafeHttpUrl = async (
  raw: string,
): Promise<SafeHttpTarget> => {
  let url: URL;
  try {
    url = new URL(raw);
  } catch (error) {
    throw new NonRetriableError(
      "HTTP Request node: Endpoint must resolve to a valid URL.",
      { cause: error },
    );
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new NonRetriableError(
      "HTTP Request node: Endpoint must use HTTP or HTTPS.",
    );
  }

  if (url.username || url.password) {
    throw new NonRetriableError(
      "HTTP Request node: Endpoint must not include credentials.",
    );
  }

  if (isBlockedHostname(url.hostname)) {
    throw new NonRetriableError(
      "HTTP Request node: Endpoint host is not allowed.",
    );
  }

  if (isIP(url.hostname)) {
    if (isBlockedIpAddress(url.hostname)) {
      throw new NonRetriableError(
        "HTTP Request node: Endpoint host is not allowed.",
      );
    }
    return {
      url,
      addresses: [{ address: url.hostname, family: isIP(url.hostname) }],
    };
  }

  let addresses: PinnedAddress[];
  try {
    addresses = await lookup(url.hostname, { all: true });
  } catch (error) {
    throw new NonRetriableError(
      "HTTP Request node: Endpoint host could not be resolved.",
      { cause: error },
    );
  }

  if (
    addresses.length === 0 ||
    addresses.some((entry) => isBlockedIpAddress(entry.address))
  ) {
    throw new NonRetriableError(
      "HTTP Request node: Endpoint host is not allowed.",
    );
  }

  return { url, addresses };
};
