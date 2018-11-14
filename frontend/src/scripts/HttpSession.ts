import m from "mithril"
import type CookieJar from "_/CookieJar"
import type { StoreType } from "_/CookieJar"
import type { RequestDetails } from "_/Parser"

interface ResultBase {
	timeTaken?: number
}

interface SuccessResult extends ResultBase {
	ok: true
	response: Response
	history: null | Response[]
	proxy: null | string
	cookies: null | StoreType
	cookieChanges?: {
		added: number
		modified: number
		removed: number
		any: boolean
	}
	request: RequestDetails
}

interface FailureResult extends ResultBase {
	ok: false
	error?: {
		title?: string
		message?: string
		stack?: string
	}
	request: null | RequestDetails
}

export type AnyResult = SuccessResult | FailureResult

export interface Response {
	status: number
	statusText: string
	url: string
	headers: Headers
	body: string
	request: RequestDetails
}

interface ExecuteResponse {
	status: number
	statusText: string
	headers: string[][]
	body: string
}

// TODO: Investigate if this class can just be merged in with Workspace.
export default class HttpSession {
	private loadingCounter: number
	result: AnyResult | null

	constructor() {
		// These are persistent throughout a session.
		this.loadingCounter = 0

		// These should reset for each execute action.
		this.result = null
	}

	get isLoading(): boolean {
		return this.loadingCounter > 0
	}

	pushLoading(): void {
		++this.loadingCounter
		m.redraw()
	}

	popLoading(): void {
		--this.loadingCounter
		m.redraw()
	}

	async executeDirect(request: RequestDetails): Promise<AnyResult> {
		const startTime = Date.now()
		const { method, url, headers, body } = request

		const headersObject: Record<string, string> = {}
		for (const [name, value] of headers) {
			headersObject[name] = value
		}

		const response = await m.request({
			url,
			method,
			headers: headersObject,
			body,
			withCredentials: true,
			serialize<T>(data: T): T {
				return data
			},
			extract(xhr: XMLHttpRequest/*, options1: m.RequestOptions<ExecuteResponse>*/): ExecuteResponse {
				const lines: string[] = xhr.getAllResponseHeaders().trim().split(/[\r\n]+/)
				const responseHeaders: string[][] = []

				for (const headerLine of lines) {
					const parts = headerLine.split(":")
					const name = parts.shift()
					if (name != null) {
						responseHeaders.push([name, parts.join(":").trim()])
					}
				}

				return {
					status: xhr.status,
					statusText: xhr.statusText,
					headers: responseHeaders,
					body: xhr.responseText,
				}
			},
		})

		if (response.status === 0) {
			// This means that the request was indeed successful and the browser has the response data, but due to some
			// CORS restriction, the browser won't let us access the data.
			// See <https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS/Errors/CORSNotSupportingCredentials>.
