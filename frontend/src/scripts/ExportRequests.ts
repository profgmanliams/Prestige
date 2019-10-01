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
