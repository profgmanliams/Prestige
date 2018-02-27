import m from "mithril"

export default { view }

function view(vnode: m.VnodeDOM<{ message?: string, extraMessage?: string }>): m.Children {
	return m("p.i", [
