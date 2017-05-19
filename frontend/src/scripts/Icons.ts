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

export const arrowSquareOut = iconComponent`
<g fill="none" stroke="currentColor">
	<polyline points="216 100 216 40 156 40"></polyline>
	<line x1="144" y1="112" x2="216" y2="40"></line>
	<path d="M184,144v64a8,8,0,0,1-8,8H48a8,8,0,0,1-8-8V80a8,8,0,0,1,8-8h64"></path>
</g>
`

export const user = iconComponent`
<g fill="currentColor">
<path d="M231.93652,211.98633a120.48718,120.48718,0,0,0-67.12-54.14258,72.00007,72.00007,0,1,0-73.63294,0,120.48813,
	120.48813,0,0,0-67.11865,54.14062,7.99981,7.99981,0,0,0,6.92432,12.00635l194.023.002a7.99957,7.99957,0,0,0,
	6.92431-12.00635Z"></path>
</g>
`

export const gear = iconComponent`
<g fill="none" stroke="currentColor">
	<circle cx="128" cy="128" r="48"></circle>
	<path d="M183.7,65.1q3.8,3.5,7.2,7.2l27.3,3.9a103.2,103.2,0,0,1,10.2,24.6l-16.6,22.1s.3,6.8,0,10.2l16.6,22.1a102.2,
		102.2,0,0,1-10.2,24.6l-27.3,3.9s-4.7,4.9-7.2,7.2l-3.9,27.3a103.2,103.2,0,0,1-24.6,10.2l-22.1-16.6a57.9,57.9,0,0,
		1-10.2,0l-22.1,16.6a102.2,102.2,0,0,1-24.6-10.2l-3.9-27.3q-3.7-3.5-7.2-7.2l-27.3-3.9a103.2,103.2,0,0,
		1-10.2-24.6l16.6-22.1s-.3-6.8,0-10.2L27.6,100.8A102.2,102.2,0,0,1,37.8,76.2l27.3-3.9q3.5-3.7,
		7.2-7.2l3.9-27.3a103.2,103.2,0,0,1,24.6-10.2l22.1,16.6a57.9,57.9,0,0,1,10.2,0l22.1-16.6a102.2,102.2,0,0,1,24.6,
		10.2Z"></path>
</g>
`

export const cookie = iconComponent`
