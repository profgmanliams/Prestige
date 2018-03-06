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
