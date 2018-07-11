import m from "mithril"
import Stream from "mithril/stream"
import SecretsPack from "./model"

export default { view }

interface Attrs {
	model: Stream<string>
	model2: SecretsPack
}

function view(vnode: m.Vnode<Attrs>): m.Children {
	return [
		m("h2.pa2", "Env Secrets"),
		m(
			"p.pa1",
			[
				"Provide a JSON object with string keys and string values below, and it'll be available as ",
				m("code", "this.env"),
				".",
