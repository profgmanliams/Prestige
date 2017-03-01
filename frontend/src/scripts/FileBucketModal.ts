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
			rows.length === 0 ? m(EmptyBucket) : m(
				Table,
				{
					thead: m("tr", [
						m("th", "#"),
						m("th", "Name"),
						m("th", "Size"),
						m("th", "Actions"),
					]),
				},
				rows,
			),
			vnode.state.isDragging && m(
				".aspect-ratio--object.f2.tc.pt5",
				{ style: { backgroundColor: "#EEEC" } },
				"Drop here to add to the file bucket!",
			),
		],
	))

	// This event fires continuously forcing Mithril to redraw repeatedly. Can we do something about it?
	function ondragover(event: DragEvent): void {
		vnode.state.isDragging = true
		event.preventDefault()
	}

	function ondragleave() {
		vnode.state.isDragging = false
		m.redraw()
	}

	function ondrop(event: DragEvent) {
		vnode.state.isDragging = false
		event.preventDefault()

		if (event.dataTransfer?.items) {
			for (const item of event.dataTransfer.items) {
				if (item.kind === "file") {
					const file = item.getAsFile()
