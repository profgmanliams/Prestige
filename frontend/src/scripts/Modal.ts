import m from "mithril"
import type { Vnode, VnodeDOM } from "mithril"
import PageEnd from "_/PageEnd"

export default { view }

function view(vnode: VnodeDOM<{ title?: string, vcenter?: boolean, footer?: m.Children }>): Vnode {
