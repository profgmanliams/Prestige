import m, { Vnode, VnodeDOM } from "mithril"
import ModalManager from "_/ModalManager"
import Button from "_/Button"
import Table from "_/Table"
import CookieJar from "_/CookieJar"
import type Workspace from "_/Workspace"

export default { view }

interface Attrs {
	cookieJar: null | CookieJar
	workspace: Workspace
}

function view(vnode: VnodeDOM<Attrs>): m.Children {
	const cookieJar = vnode.attrs.cookieJar
	const rows: Vnode[] = []
	let i = 0

	for (const [domain, byPath] of cookieJar == null ? [] : Object.entries(cookieJar.store)) {
		for (const [path, byName] of Object.entries(byPath)) {
			for (const [name, morsel] of Object.entries(byName)) {
				rows.push(m("tr", [
					m("td", ++i),
					m("td.t-domain", domain),
					m("td.t-path", path),
					m("td.t-name", name),
					m("td.t-value", morsel.value),
					m("td.t-expires", m(TimeView, { time: morsel.expires })),
					m("td", [
						m(
							Button,
							{
								class: "compact danger-light",
								// TODO: Cookie jar is not saved after deletion here.
