import m from "mithril"
import ModalManager from "_/ModalManager"
import humanSizeDisplay from "_/humanSizeDisplay"
import FileBucket from "_/FileBucket"
import Table from "_/Table"

export default { oninit, view }

interface Attrs {
	fileBucket: FileBucket
}

interface State {
	isDragging: boolean
}

function oninit(vnode: m.VnodeDOM<Attrs, State>): void {
	vnode.state.isDragging = false
}

function view(vnode: m.VnodeDOM<Attrs, State>): m.Children {
	const rows: m.Vnode[] = []

	let n = 1
	for (const file of vnode.attrs.fileBucket) {
		rows.push(m("tr", [
			m("td", n++),
			m("td", file.name),
			m("td", humanSizeDisplay(file.size)),
			m("td", ""),
		]))
	}

	return m("div", { ondragover, ondragleave, ondrop }, m(
		ModalManager.DrawerLayout,
		{
			title: "File Bucket",
		},
		[
