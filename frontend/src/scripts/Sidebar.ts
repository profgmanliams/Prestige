import m from "mithril"
import NavLink from "_/NavLink"
import DocumentBrowser from "_/DocumentBrowser"
import PageEnd from "_/PageEnd"
import OptionsModal from "_/Options"
import EnvSecretsView from "_/secrets/view"
import type Workspace from "_/Workspace"
import { isDev } from "_/Env"
import * as Icons from "_/Icons"

type PaneType = "d" | "o" | "e"

interface Attrs {
	workspace: Workspace
}

export default function Sidebar(): m.Component<Attrs> {
	let currentPane: null | PaneType = null
	let currentWidth = 240
	let dragStartWidth: number = currentWidth
	let dragStartClientX = 0

	return { view }

	function view(vnode: m.Vnode<Attrs>): m.Children {
		return m("aside.sidebar.flex", [
			m(".tab-bar", [
				tabLink("Documents", "d", Icons.files),
				isDev() && tabLink("Env Secrets", "e", Icons.key),
				tabLink("Options", "o", Icons.gear),
			]),
			currentPane != null && [
				m(".content", { style: { width: `${currentWidth}px` } }, [
					currentPane === "d" && m(DocumentBrowser),
					currentPane === "o" && m(OptionsModal),
					currentPane === "e" && m(
						EnvSecretsView,
						{
							model: vnode.attrs.workspace.secretsObject,
							model2: vnode.attrs.workspace.secrets,
						},
					),
					m(PageEnd),
				]),
				isDev() && m(".grip", {
					title: "Resize the sidebar",
					onmousedown: onMouseDown,
