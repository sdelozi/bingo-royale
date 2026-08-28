import "@testing-library/jest-dom";
import { fetch, Headers, Request, Response } from "undici";

if (!globalThis.fetch) {
	globalThis.fetch = fetch as unknown as typeof globalThis.fetch;
}

if (!globalThis.Headers) {
	globalThis.Headers = Headers as typeof globalThis.Headers;
}

if (!globalThis.Request) {
	globalThis.Request = Request as typeof globalThis.Request;
}

if (!globalThis.Response) {
	globalThis.Response = Response as typeof globalThis.Response;
}
