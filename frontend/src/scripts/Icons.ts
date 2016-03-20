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
<g fill="currentColor">
	<path d="M225.94092,114.89844a15.91968,15.91968,0,0,0-13.46094-3.085,23.99389,23.99389,0,0,1-29.27832-23.14063,
	15.94771,15.94771,0,0,0-15.87354-15.875A23.99268,23.99268,0,0,1,144.187,43.51953a16.01308,16.01308,0,0,0-15.562
	-19.51367c-.21729-.001-.43018-.00195-.647-.00195A104,104,0,1,0,231.99463,127.3623v-.001A15.97461,15.97461,0,0,0,
	225.94092,114.89844ZM75.51465,99.51465a12.0001,12.0001,0,1,1,0,16.9707A12.00062,12.00062,0,0,1,75.51465,99.51465Z
	m24.9707,72.9707a12.0001,12.0001,0,1,1,0-16.9707A12.00062,12.00062,0,0,1,100.48535,172.48535Zm27.0293-40a12.0001,
	12.0001,0,1,1,16.9707,0A12.00019,12.00019,0,0,1,127.51465,132.48535Zm36.9707,48a12.0001,12.0001,0,1,1,0-16.9707
	A12.00062,12.00062,0,0,1,164.48535,180.48535Z"></path>
</g>
`

export const folderClosed = iconComponent`
<g fill="currentColor">
	<path d="M215.99512,71.99805h-84.6875l-27.3125-27.3125a15.8907,15.8907,0,0,0-11.3125-4.6875H39.99512a16.01581,
	16.01581,0,0,0-16,16V200.61523a15.404,15.404,0,0,0,15.39062,15.38282h177.5a15.13062,15.13062,0,0,0,15.10938
	-15.10938V87.99805A16.01582,16.01582,0,0,0,215.99512,71.99805Zm-176-16h52.6875l16,16H39.99512Z"></path>
</g>
`

export const info = iconComponent`
<g fill="currentColor">
	<path d="M128.00146,23.99963a104,104,0,1,0,104,104A104.11791,104.11791,0,0,0,128.00146,23.99963ZM126.002,72
	a12,12,0,1,1-12,12A12,12,0,0,1,126.002,72Zm9.99951,111.99963h-8a8.0004,8.0004,0,0,1-8-8v-48a8,8,0,1,1,0-16h8
	a8.00039,8.00039,0,0,1,8,8v48a8,8,0,0,1,0,16Z"></path>
</g>
`

export const files = iconComponent`
<g fill="none" stroke="currentColor">
