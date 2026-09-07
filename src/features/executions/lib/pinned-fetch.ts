import http from "node:http";
import https from "node:https";
import { Readable } from "node:stream";

export type PinnedAddress = {
  address: string;
  family: number;
};

type LookupCallback = (
  error: NodeJS.ErrnoException | null,
  address: string | PinnedAddress[],
  family?: number,
) => void;

export const createPinnedLookup = (addresses: PinnedAddress[]) => {
  return (
    _hostname: string,
    options: { all?: boolean } | LookupCallback,
    callback?: LookupCallback,
  ) => {
    const cb = typeof options === "function" ? options : callback;
    const opts = typeof options === "function" ? undefined : options;
    if (!cb) {
      throw new Error("DNS lookup callback is required");
    }
    if (!addresses[0]) {
      cb(
        new Error("No resolved addresses to pin") as NodeJS.ErrnoException,
        "",
      );
      return;
    }
    if (opts?.all) {
      cb(null, addresses);
      return;
    }
    cb(null, addresses[0].address, addresses[0].family);
  };
};

const toHeaders = (headers: http.IncomingHttpHeaders) => {
  const result = new Headers();
  for (const [key, value] of Object.entries(headers)) {
    if (value === undefined) {
      continue;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        result.append(key, item);
      }
      continue;
    }
    result.set(key, value);
  }
  return result;
};

export const createPinnedFetch = (addresses: PinnedAddress[]): typeof fetch => {
  const lookup = createPinnedLookup(addresses);

  return async (input, init = {}) => {
    const url = new URL(
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url,
    );
    const client = url.protocol === "https:" ? https : http;
    const method = init.method ?? "GET";
    const headers = new Headers(init.headers);
    const body =
      typeof init.body === "string"
        ? init.body
        : init.body == null
          ? undefined
          : String(init.body);

    return await new Promise<Response>((resolve, reject) => {
      const request = client.request(
        url,
        {
          method,
          headers: Object.fromEntries(headers.entries()),
          lookup,
          signal: init.signal ?? undefined,
        },
        (response) => {
          resolve(
            new Response(Readable.toWeb(response) as ReadableStream, {
              status: response.statusCode ?? 200,
              statusText: response.statusMessage ?? "",
              headers: toHeaders(response.headers),
            }),
          );
        },
      );

      request.on("error", reject);
      if (body) {
        request.write(body);
      }
      request.end();
    });
  };
};
