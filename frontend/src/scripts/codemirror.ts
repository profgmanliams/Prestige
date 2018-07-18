import CodeMirror from "codemirror"
import "codemirror/addon/selection/active-line"
import "codemirror/addon/edit/matchbrackets"
import "codemirror/addon/edit/closebrackets"
import "codemirror/addon/dialog/dialog"
import "codemirror/addon/search/searchcursor"
import "codemirror/addon/search/search"
import "codemirror/addon/fold/foldcode"
import "codemirror/addon/fold/brace-fold"
import "codemirror/addon/fold/foldgutter"
import "codemirror/addon/comment/comment"
import "codemirror/addon/lint/lint"
import "codemirror/mode/javascript/javascript"
import "codemirror/mode/htmlmixed/htmlmixed"
import * as acorn from "acorn"

interface PrestigeState {
	context: string
	bodyJustStarted: boolean
	jsState: unknown
	bodyMode: null | CodeMirror.Mode<unknown>
	bodyState: unknown
}

/* Parser state contexts

### javascript |
| javascript
console.log(42); | javascript
 | javascript
### |
 | request-space-1
POST https://httpbun.com/post | request-url
Content-Type: application/json | request-headers*
X-Custom-Header: more| request-headers
 | request-space-2
payload body here| request-body
| request-body
###|

*/

CodeMirror.defineMode("prestige", prestigeMode)
CodeMirror.defineMode("javascript-custom", javascriptCustomMode)

function prestigeMode(
	config: CodeMirror.EditorConfiguration,
	// Unused modeOptions: Record<string, any>,
): CodeMirror.Mode<PrestigeState> {
	const jsMode = CodeMirror.getMode(config, "javascript-custom")
	const jsonMode = CodeMirror.getMode(
		config,
		{ name: "javascript", json: true } as CodeMirror.ModeSpec<{json: boolean}>,
	)

	return {
		name: "prestige",
		lineComment: "#",
		token,
		startState,
		blankLine,
		copyState,
	}

	function startState(): PrestigeState {
		return {
			context: "request-space-1",
			bodyJustStarted: false,
			jsState: null,
			bodyMode: null,
			bodyState: null,
		}
	}

	function copyState(state: PrestigeState): PrestigeState {
		return {
			...state,
			jsState: state.jsState == null ? null : (CodeMirror as any).copyState(jsMode, state.jsState),
			bodyState: state.bodyState == null ? null : (CodeMirror as any).copyState(state.bodyMode, state.bodyState),
		}
	}

	function token(stream: CodeMirror.StringStream, state: PrestigeState): string | null {
		const { bodyJustStarted } = state
		state.bodyJustStarted = false

		if (stream.sol() && stream.match("###")) {
			if (state.jsState !== null) {
				state.jsState = null
			}
			if (state.bodyState !== null) {
				state.bodyState = null
			}

			stream.eatSpace()
			state.context = stream.match("javascript") ? "javascript" : "request-space-1"
			if (state.context === "javascript") {
				state.jsState = CodeMirror.startState(jsMode)
			}

			stream.skipToEnd()
			return "tag header"
		}

		if (state.context === "javascript") {
			if (state.jsState === null) {
				console.error("incorrect state in javascript", stream.current())
			}
			return jsMode.token ? jsMode.token(stream, state.jsState) : "error"
		}

