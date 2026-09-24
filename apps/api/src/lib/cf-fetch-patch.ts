/**
 * Cloudflare Workers reject RequestInit.cache === "default" (axios 1.20+).
 * Must load before @stellar/stellar-sdk makes any RPC call.
 */
const NativeRequest = globalThis.Request;

type InitMaybeCache = RequestInit & { cache?: string };

globalThis.Request = class Request extends NativeRequest {
  constructor(input: RequestInfo | URL, init?: RequestInit) {
    const i = init as InitMaybeCache | undefined;
    if (i && i.cache === "default") {
      const { cache: _ignored, ...rest } = i;
      super(input, rest as RequestInit);
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
  const i = init as InitMaybeCache | undefined;
  if (i && i.cache === "default") {
    const { cache: _ignored, ...rest } = i;
    return nativeFetch(input, rest as RequestInit);
  }
  return nativeFetch(input, init);
};

export {};
