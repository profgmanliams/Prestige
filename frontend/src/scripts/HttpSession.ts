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

