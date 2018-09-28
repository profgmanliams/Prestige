import m, { VnodeDOM } from "mithril"
import Workspace from "_/Workspace"
import CodeMirror from "codemirror"
import LoadingLabel from "_/LoadingLabel"
import Toolbar from "_/Toolbar"
import Table from "_/Table"
import PageEnd from "_/PageEnd"
import NavLink from "_/NavLink"
import NothingMessage from "_/NothingMessage"
import CodeBlock from "_/CodeBlock"
import humanSizeDisplay from "_/humanSizeDisplay"
import * as utils from "_/utils"
import type { Response } from "_/HttpSession"
import ModalManager from "_/ModalManager"

interface Attrs {
	class?: string
	workspace: Workspace
}

interface State {
	requestMirror: CodeMirror.Editor
	responseMirror: CodeMirror.Editor
}

export default function ResultPane(): m.Component<Attrs, State> {
	return { view }

	function view(vnode: VnodeDOM<Attrs, State>) {
		const workspace = vnode.attrs.workspace

		if (!workspace.isResultPaneVisible) {
			return null
		}

		const { result, isLoading } = workspace.session

		if (isLoading) {
			return m(".result-pane", { class: vnode.attrs.class }, [
				m(LoadingLabel),
				// TODO: Show Cancel button after a few seconds of request not completing.
				// M("p", m(LinkButton, "Cancel")),
			])
		}

		if (result == null) {
			return null
		}

		const toolbar = m(Toolbar, {
			left: m(".flex", [
				m(
					NavLink,
					{
						disabled: !workspace.isRunAgainAvailable(),
						onclick: () => {
							workspace.runAgain()
						},
					},
					"Run Again",
				),
				m(NavLink, { onclick: () => workspace.findInEditor() }, "Find in Editor"),
			]),
			right: m(".flex", [
				m(NavLink, { onclick: () => workspace.isResultPaneVisible = false }, "Hide"),
			]),
		})

		if (!result.ok) {
			const error = result.error ?? {}
			return m(".result-pane.error", { class: vnode.attrs.class }, [
				toolbar,
				m(".body", [
					m("h2.pl2", "Error executing request"),
					error.title != null && m("h3", error.title),
					m(
						"pre.message.overflow-x-auto.overflow-y-hidden.ph2",
						error.message || "Unknown error occurred.",
					),
					error.stack && m("details", [
						m("summary.pointer", "Stack trace"),
						m("pre.ph2.ml2", error.stack),
					]),
					result.request && [
						m("h2.pl2", "Request details"),
						m(Table, { tableClass: "mono" }, [
							m("tr", [
								m("th.tl.v-top", "Method"),
								m("td", result.request.method || m("em", "Empty (which is okay, will just use GET).")),
							]),
							m("tr", [
								m("th.tl.v-top", "URL"),
								m("td", result.request.url || m("em", "Empty.")),
							]),
							m("tr", [
								m("th.tl.v-top", "Body"),
								m("td", m("pre.ma0", result.request.body) || m("em", "Empty.")),
							]),
							Object.entries(result.request).map(([name, value]) => {
								return name !== "method" && name !== "url" && name !== "body" && m("tr", [
									m("th.tl", name.replace(/\b\w/g, s => s.toUpperCase())),
									m("td", typeof value === "string"
										? value
										: JSON.stringify(value, null, 2)),
								])
							}),
						]),
					],
					m(PageEnd),
				]),
			])
		}

		const { response, proxy, history, cookieChanges } = result

		if (vnode.state.responseMirror) {
			vnode.state.responseMirror.setValue(response.body)
		}

		if (vnode.state.requestMirror) {
			vnode.state.requestMirror.setValue(response.request.body || "")
		}

		return m(".result-pane", { class: vnode.attrs.class }, [
			toolbar,
			m(".body", [
				m("ul.messages", [
					history != null && history.length > 0 && m(
						"li",
						`Redirected ${ history.length > 1 ? `${history.length} times` : "once" }.` +
							" Scroll down for more details.",
					),
					result.timeTaken != null && m("li", [
						"Finished in ",
						m("b", m(IntervalDisplay, { ms: result.timeTaken })),
						".",
					]),
					cookieChanges && cookieChanges.any && m("li",
						[
							"Cookies: ",
							m.trust([
								cookieChanges.added ? `${cookieChanges.added} new` : null,
								cookieChanges.modified ? `${cookieChanges.modified} modified` : null,
								cookieChanges.removed ? `${cookieChanges.removed} removed` : null,
							].filter(v => v != null).join(", ")),
							".",
						],
					),
					m("li", proxy != null
						? [
							"Run with proxy at ",
							m("a", { href: proxy, target: "_blank" }, proxy),
							". ",
							m("a", { href: "/docs/guides/proxy/", target: "_blank" }, "Learn More"),
							".",
						]
						: "Direct cross-origin request, no proxy used. Only limited information available."),
				]),
				renderResponse(response),
				history ? history.map(r => renderResponse(r)).reverse() : null,
				m(PageEnd),
			]),
		])
	}

	function renderResponse(response: Response, proxy: null | string = null) {
		const responseContentType = getContentTypeFromHeaders(response && response.headers)
		const requestContentType = getContentTypeFromHeaders(response && response.request.headers)
		const nothingMessageAttrs = {
			extraMessage: proxy == null ? "This may be because a proxy was not used to run this request." : "",
		}

		const skin = ({
			2: "is-2xx",
			3: "is-3xx",
			4: "is-4xx",
			5: "is-5xx",
		})[response.status.toString()[0]] ?? ""

		const htmlBaseUrl = response.url ? new URL(response.url).origin : null
		const statusTitleCase = response?.statusText.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase())

		return response && m(".response", [
			m(
				".t-response-status.status.f2.pa2",
				{ class: skin },
				statusTitleCase,
			),
			m("pre.pa2.pb3.overflow-x-auto.overflow-y-hidden", response.request.method + " " + response.url),
