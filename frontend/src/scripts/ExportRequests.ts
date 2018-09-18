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
		this.request = request
		this.cookieJar = cookieJar
	}

	toCurl(options: Partial<CurlFormatOptions> = {}): ExportedRequest {
		const { includeCookies, singleLine, useLongFlags } = fillOptionsPartial(options)

		const newLineToken: Token = [singleLine ? " " : " \\\n\t", ""]
		const spaceToken: Token = [" ", ""]

		const tokens: Token[] = [["curl", "keyword"]]

		tokens.push(spaceToken, [useLongFlags ? "--request" : "-X", "variable"])
		tokens.push(spaceToken, [this.request.method, "string"])

		for (const [name, value] of this.request.headers) {
			tokens.push(newLineToken, [useLongFlags ? "--header" : "-H", "variable"])
			tokens.push(spaceToken, [`'${name.replace(/\b\w/g, (c) => c.toUpperCase())}: ${value}'`, "string"])
		}

