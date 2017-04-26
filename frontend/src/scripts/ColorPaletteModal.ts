import m from "mithril"
import ModalManager from "_/ModalManager"

export default { view }

function view(): m.Children {
	return m(
		ModalManager.DrawerLayout,
		{
			title: "Color Palette",
		},
		[
			m(CakeRow, { prefix: "gray" }),
			m(CakeRow, { prefix: "primary" }),
			m(CakeRow, { prefix: "blue" }),
			m(CakeRow, { prefix: "green" }),
			m(CakeRow, { prefix: "yellow" }),
			m(CakeRow, { prefix: "red" }),
			m(CakeRow, { prefix: "extra" }),
		],
	)
}

function isVarAvailable(name: string): boolean {
	return getComputedStyle(document.documentElement).getPropertyValue("--" + name) !== ""
}

const CakeRow = {
	view(vnode: m.VnodeDOM<{ prefix: string }>) {
		const { prefix } = vnode.attrs
		return m("p.tc", [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => m(Cake, { name: `${prefix}-${n}` })))
	},
