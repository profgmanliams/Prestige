import m from "mithril"
import * as Exporter from "_/ExportRequests"
import CodeBlock from "_/CodeBlock"
import type { RequestDetails } from "_/Parser"
import Button from "_/Button"
import { copyToClipboard, downloadText, showGhost } from "_/utils"
import type CookieJar from "_/CookieJar"

export default { view }

interface Attrs {
	request: null | RequestDetails
	cookieJar: null | CookieJar
}

interface State {
	useLongFlags: boolean
	includeCookies: boolean
}

function view(vnode: m.VnodeDOM<Attrs, State>): m.Children {
	const { request, cookieJar } = vnode.attrs
	const { includeCookies, useLongFlags } = vnode.state

	if (request == null) {
		return m("p", "No request to export")
	}

	const exporter = new Exporter.Exporter(request, cookieJar)

	console.log(exporter.toCurl({ includeCookies, useLongFlags }).toComponentChildren())

	return m(".ma2", { style: { width: "50vw" } }, [
