import m, { VnodeDOM } from "mithril"

interface Attrs {
	style?: null | "primary"
	class?: string
	type?: "button" | "submit"
	onclick?: (event: Event) => void
	disabled?: boolean
	isLoading?: boolean
}

export default {
	view,
