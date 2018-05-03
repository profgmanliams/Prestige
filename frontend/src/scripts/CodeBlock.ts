import m from "mithril"
import CodeMirror from "_/codemirror"
import NothingMessage from "_/NothingMessage"
import { repeat } from "_/utils"
import padStart from "lodash/padStart"

interface Attrs {
	text?: string
	spec?: string
	elements?: m.Children
	class?: string
}

/**
 * This is just a glorified `pre` element. This is component optimized and only-used for read-only code snippet display.
 */
export default { view }

const tabSize = 4

// Number of bytes, if response body is larger than this, syntax highlighting is turned off.
const tooLargeThreshold = 400 * 1000

function view(vnode: m.VnodeDOM<Attrs>): m.Children {
	const { elements } = vnode.attrs
	let { spec } = vnode.attrs

	if (spec == null) {
		spec = "text"
	}

	// Code taken from the official runMode addon of CodeMirror.
	const fullText: string = asString(vnode.attrs.text, spec)

	if (fullText === "" && elements == null) {
		return m(NothingMessage)
	}

	const isTooLarge = fullText.length > tooLargeThreshold

	return [
		!isTooLarge && m(
			"pre.overflow-x-auto.cm-s-default",
			{
				class: vnode.attrs.class,
			},
			elements != null ? elements : renderTokens(fullText, CodeMirror.getMode(CodeMirror.defaults, spec)),
		),
		isTooLarge && [
			m("p", "Response content too large. Syntax highlighting turned off."),
			m(
				"pre.overflow-x-auto.flex",
				{
					class: vnode.attrs.class,
				},
				fullText,
			),
		],
	]
}

function renderTokens(fullText: string, mode: CodeMirror.Mode<unknown>): m.Children {
	const lineNumEls: m.Vnode[] = []
	const rows: m.Children = []

	lineNumEls.push(m("span.line-nums", 1))
	rows.push(lineNumEls[0])

	interface NestingInfo {
		commentEl: m.Vnode
		count: number
		openIndex: number
		summaryEndIndex: number
		isClosed: boolean
	}

	const nestingStack: NestingInfo[] = []

	let col = 0
	let prevTokenText: null | string = null
	let prevNewLineIndex = 0

	runMode(fullText, mode, (text: string, style: null | string) => {
		if (text === "\n") {
			const tokenSpan = m("span", text)

			if (nestingStack.length > 0 && nestingStack[nestingStack.length - 1].isClosed) {
				const stackItem = nestingStack.pop()
				if (stackItem != null) {
					rows.splice(
						stackItem.openIndex,
						rows.length - stackItem.openIndex,
						m(
							"details.fold",
							{
								open: true,
								onclick(event: Event) {
									if (!(event.target as Element).matches(".line-nums")) {
										event.preventDefault()
									}
								},
							},
							[
								m("summary", rows.slice(stackItem.openIndex, stackItem.summaryEndIndex)),
								rows.slice(stackItem.summaryEndIndex + 1),
							],
						),
					)
				}
			}

			if (prevTokenText === "{" || prevTokenText === "[") {
				const commentEl = m("span.i.cm-comment.no-select", "")
				rows.push(commentEl)
				nestingStack.push({
					commentEl,
					count: 1,
					openIndex: prevNewLineIndex + 1,
					summaryEndIndex: rows.length,
					isClosed: false,
				})
			}
