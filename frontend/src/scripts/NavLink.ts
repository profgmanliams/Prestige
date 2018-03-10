import m from "mithril"

export default {
	view,
}

interface Attrs {
	class?: string
	type?: string
	href?: string
	title?: string
	isActive?: boolean
	tooltip?: string
	tooltipDir?: "right"
	disabled?: boolean
	onclick?: ((event: MouseEvent) => void)
}

function view(vnode: m.VnodeDOM<Attrs>): m.Children {
	return m(
		(vnode.attrs.href ? "a.link" : "button.bn.bg-transparent") + ".nav-link.pv1.ph2",
		{
