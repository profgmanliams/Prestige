import m from "mithril"

// Icons are modified versions of Phosphor <https://phosphoricons.com/>.

interface IconAttrs {
	style?: "regular" | "bold"
}

// This is not a Mithril component, although it might look like one. It's a component generator function.
function iconComponent(svgParts: TemplateStringsArray): m.Component<IconAttrs> {
	const svg: string = svgParts.join("").trim()

	return { view }

	function view(vnode: m.Vnode<IconAttrs>): m.Children {
		return m(
			"svg",
			{
				xmlns: "http://www.w3.org/2000/svg",
				viewBox: "0 0 256 256",
				width: "1em",
				height: "1em",
				class: "icon",
				"stroke-width": vnode.attrs.style === "bold" ? 24 : 16,
			},
			m.trust(svg),
		)
	}
}
