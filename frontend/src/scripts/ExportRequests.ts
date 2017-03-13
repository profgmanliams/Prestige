import m from "mithril"
import type { RequestDetails } from "_/Parser"
import type CookieJar from "_/CookieJar"

export interface CurlFormatOptions {
	includeCookies: boolean
	singleLine: boolean
	useLongFlags: boolean
}

type Token = [token: string, style: string]

class ExportedRequest {
	tokens: Token[]

	constructor(tokens: Token[]) {
		this.tokens = tokens
	}

	toPlainString(): string {
		const parts: string[] = []
		for (const token of this.tokens) {
			parts.push(token[0])
		}
		return parts.join("")
	}

	toComponentChildren(): m.Children {
		const children: m.Children = []
		for (const token of this.tokens) {
			children.push(m("span", { class: token[1].replace(/\b(\w)/g, "cm-$1") }, token[0]))
		}
		return children
	}
}

export class Exporter {
	request: RequestDetails
	cookieJar: null | CookieJar

	constructor(request: RequestDetails, cookieJar: null | CookieJar) {
