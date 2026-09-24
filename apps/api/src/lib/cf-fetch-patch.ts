/**
 * Cloudflare Workers reject RequestInit.cache === "default" (axios 1.20+).
 * Must load before @stellar/stellar-sdk makes any RPC call.
 */
const NativeRequest = globalThis.Request;

globalThis.Request = class Request extends NativeRequest {
  constructor(input: RequestInfo | URL, init?: RequestInit) {
    if (init && init.cache === "default") {
      const { cache: _ignored, ...rest } = init;
      super(input, rest);
    } else {
      super(input, init);
    }
  }
} as typeof NativeRequest;

const nativeFetch = globalThis.fetch.bind(globalThis);
globalThis.fetch = (
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> => {
  if (init && init.cache === "default") {
    const { cache: _ignored, ...rest } = init;
    return nativeFetch(input, rest);
  }
  return nativeFetch(input, init);
};

export {};
