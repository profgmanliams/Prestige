import type { AnyResult } from "_/HttpSession"
import HttpSession from "_/HttpSession"
import m from "mithril"
import CodeMirror from "_/codemirror"
import type { RequestDetails } from "_/Parser"
import { BlockType, extractRequest, parse } from "_/Parser"
import CookieJar from "_/CookieJar"
import { proxyUrl } from "_/Env"
import {
	currentProviders,
	currentSheet,
	currentSheetName,
	Provider,
	saveSheetAuto,
	saveSheetManual,
	SaveState,
	Sheet,
	Source,
} from "_/Persistence"
import Stream from "mithril/stream"
import throttle from "lodash/throttle"
import FileBucket from "_/FileBucket"
import Context from "_/Context"
import { ping } from "_/pings"
import ExportPane from "_/ExportPane"
import ModalManager from "_/ModalManager"
import SecretsPack from "_/secrets/model"

// Duplicated in backend/gist/views.py
const DEFAULT_EDITOR_CONTENT = `# Welcome to Prestige! Your newest developer tool!
# Just enter the HTTP requests you want to make and hit Ctrl+Enter (or Cmd+Enter) to execute.
# Like this one right here:

GET https://httpbun.com/get?name=haha

###

# Lines starting with a single '#' like this are comments.
# Learn more about the syntax at ${ window.location.origin }/docs/guides/syntax/.
# Let's make a POST request!

POST https://httpbun.com/post
Content-Type: application/x-www-form-urlencoded

username=sherlock&password=elementary

###

# Custom headers, easy as popcorn.
# Learn more at ${ window.location.origin }/docs/guides/syntax/#header-section.

GET https://httpbun.com/headers
X-Custom1: custom header value one
X-Custom2: custom header value two

### javascript

// This is a Javascript block, so comments start with '//'.
// The following will be available for templating in requests *after* this Javascript block.
// Learn more at ${ window.location.origin }/docs/guides/javascript-blocks/.
this.data.postUrl = "post"

###

# Let's use templates to make the same POST request as before!
# Learn more at: ${ window.location.origin }/docs/guides/templating/.
POST https://httpbun.com/dollar{postUrl}
Content-Type: application/x-www-form-urlencoded

username=sherlock&password=elementary

###

# We can define a Javascript function to be called when this request finishes execution.
POST https://httpbun.com/post

one=1&two=2

@onFinish(response) {
	alert("Request finished!")
}
`.replace(/\bdollar\{/g, "${")

export default class Workspace {
	codeMirror: null | CodeMirror.Editor
	session: HttpSession
	fileBucket: FileBucket
	currentSheet: null | Sheet
	currentSheetQualifiedPath: Stream<string>
	cookieJar: null | CookieJar
	updateEditorDisplay: ReturnType<typeof throttle>
	isResultPaneVisible: boolean
	secretsObject: Stream<string>
	secrets: SecretsPack
	defaultProxy: null | string
	private _content: string
	private prevExecuteBookmark: null | CodeMirror.TextMarker
	private flashQueue: { start: number, end: number }[]
	private widgetMarks: CodeMirror.TextMarker[]
	private _disableAutoSave: boolean

	constructor() {
		this.codeMirror = null
		this._content = ""
		this._lines = null
		this.prevExecuteBookmark = null
		this.fileBucket = new FileBucket()
		this.session = new HttpSession()
		this.defaultProxy = proxyUrl()
		this.flashQueue = []
		this.widgetMarks = []
		this.currentSheet = null
		this.currentSheetQualifiedPath = Stream()
		this._disableAutoSave = false

		Stream.lift<[string, Provider<Source>[]], void>((qualifiedPath: string) => {
			this.loadSheet(qualifiedPath)
				.catch((e) => {
					console.error("Error in loadSheet", e)
				})
		}, this.currentSheetQualifiedPath, currentProviders)

		this.doExecute = this.doExecute.bind(this)
		this.onNewClicked = this.onNewClicked.bind(this)
		this.onDuplicateClicked = this.onDuplicateClicked.bind(this)
		this.onExportClicked = this.onExportClicked.bind(this)
		this.onPrettifyClicked = this.onPrettifyClicked.bind(this)
		this.saveSheetAuto = throttle(this.saveSheetAuto.bind(this), 3000, { trailing: true })
		this.updateEditorDisplay = throttle(this._updateEditorDisplay.bind(this), 3000, { trailing: true })
		this.cookieJar = null
		this.isResultPaneVisible = true
		this.secretsObject = Stream("")
		this.secrets = new SecretsPack()

		currentSheet.map((value) => {
			this.currentSheet = value instanceof Sheet ? value : null

			if (this.currentSheet != null) {
				if (!this.currentSheet.body) {
					this.currentSheet.body = DEFAULT_EDITOR_CONTENT
				}

				this.setContent(this.currentSheet.body)

				this.cookieJar = CookieJar.loadOrCreate(this.currentSheetQualifiedPath())

			}

			m.redraw()
		})
	}

	private _lines: null | string[]

	get lines(): string[] {
		if (this._lines == null) {
			this._lines = this.getContent().split("\n")
		}

		return this._lines
	}

	get saveState(): SaveState {
		return this.currentSheet?.saveState ?? SaveState.unchanged
	}

	async loadSheet(sheetPath: string): Promise<void> {
		currentSheetName(sheetPath)
	}

	initCodeMirror(element: HTMLElement): void {
		if (this.codeMirror != null) {
			return
		}

		// These two mappings are used for back/forward in macOS. Let the browser handle them.
		delete (CodeMirror as any).keyMap.macDefault["Cmd-["]
		delete (CodeMirror as any).keyMap.macDefault["Cmd-]"]

		console.log("Initializing CodeMirror for Workspace.")
		this.codeMirror = CodeMirror(element, {
			mode: "prestige",
			lineNumbers: true,
			matchBrackets: {},
			autofocus: true,
			autoCloseBrackets: true,
			styleActiveLine: true,
			gutters: ["prestige", "CodeMirror-lint-markers"],
			lint: true,
			value: this.getContent(),
			extraKeys: {
				"Ctrl-Enter": this.doExecute,
				"Cmd-Enter": this.doExecute,
				"Cmd-F": "findPersistent",
				"Cmd-/": "toggleComment",
				"Shift-Tab": "indentLess",
			},
		})

		// Buffer space after the last line in the editor. We are using a constant value here, instead of the
		// `scrollpastend` addon of CodeMirror, because that addon doesn't work right with Prestige on Safari.
		;(this.codeMirror as any).display.lineSpace.parentNode.style.paddingBottom = "96px"

		this.updateEditorDisplay()
		this.updateEditorDisplay.flush()

		this.codeMirror.on("changes", () => {
			m.redraw()  // Need this on every change, to update any unsaved/saved indicator.
			this.updateEditorDisplay()
			if (this._disableAutoSave) {
				return
			}
			this._lines = null
			if (this.currentSheet != null) {
				console.log("set isSaved to false")
				this.currentSheet.saveState = SaveState.unsaved
			}
			this.saveSheetAuto()
		})
	}

	saveSheetAuto(): void {
		if (this._disableAutoSave) {
			return
		}

		if (this.currentSheet == null) {
			console.error("Can't auto-save missing sheet. Something's wrong.")
			return
		}

		this.currentSheet.body = this.getContent()
		saveSheetAuto(this.currentSheetQualifiedPath(), this.currentSheet).finally(m.redraw)
	}

	saveSheetManual(): void {
		if (this.currentSheet == null) {
			console.error("Can't manual-save missing sheet. Something's wrong.")
			return
		}

		this.currentSheet.body = this.getContent()
		saveSheetManual(this.currentSheetQualifiedPath(), this.currentSheet).finally(m.redraw)
	}

	getContent(): string {
		return this.codeMirror ? this.codeMirror.getValue() : this._content
	}

	setContent(content: string): void {
		this._lines = null
		if (this.codeMirror == null) {
			this._content = content
		} else {
			this._disableAutoSave = true
			this.codeMirror.setValue(content)
			this._disableAutoSave = false
		}
		(this.saveSheetAuto as any).flush()
		this.updateEditorDisplay.flush()
	}

	/**
	 * Update gutter, widgets, highlights etc. of the CodeMirror editor. Usually called when the contents of the editor
	 * change.
	 */
	_updateEditorDisplay(): void {
		console.log("Updating editor display")
		if (this.codeMirror == null) {
			return
		}

		console.log("Updating editor display in workspace.", this.lines.length)
		this.codeMirror.clearGutter("prestige")

		const lines: string[] = this.lines
		const structure2 = parse(lines)

		for (const mark of this.widgetMarks.splice(0, this.widgetMarks.length)) {
			mark.clear()
		}

		for (const i of lines.keys()) {
			this.codeMirror.removeLineClass(i, "background", "line-javascript")
		}

		for (const block of structure2) {
			const startLine: string = lines[block.start]

			if (block.type === BlockType.PAGE_BREAK) {
				const buttonClasses = [
					"ml2", "pointer", "silver", "hover-black", "hover-bg-near-white", "br4", "pv1", "ph2", "underline",
					"f7", "sans-serif",
				]

				const el = document.createElement("span")
				el.classList.add(...buttonClasses)
				el.innerHTML = "+new"
				el.title = "Insert new request here."
				el.dataset.lineNum = block.start.toString()
				el.addEventListener("click", this.onNewClicked)
				this.widgetMarks.push(this.codeMirror.setBookmark(
					{ line: block.start, ch: startLine.length },
					{ widget: el, insertLeft: true },
				))

				const duplicateBtn = document.createElement("span")
				duplicateBtn.classList.add(...buttonClasses)
				duplicateBtn.innerHTML = "&divide;duplicate"
				duplicateBtn.title = "Duplicate below request."
				duplicateBtn.dataset.lineNum = block.start.toString()
				duplicateBtn.addEventListener("click", this.onDuplicateClicked)
				this.widgetMarks.push(this.codeMirror.setBookmark(
					{ line: block.start, ch: startLine.length },
					{ widget: duplicateBtn, insertLeft: true },
				))

				const exportBtn = document.createElement("span")
				exportBtn.classList.add(...buttonClasses)
				exportBtn.innerHTML = "export&hellip;"
				exportBtn.title = "Export below request in cURL format."
				exportBtn.dataset.lineNum = block.start.toString()
				exportBtn.addEventListener("click", this.onExportClicked)
				this.widgetMarks.push(this.codeMirror.setBookmark(
					{ line: block.start, ch: startLine.length },
					{ widget: exportBtn, insertLeft: true },
				))

			} else if (block.type === BlockType.JAVASCRIPT) {
				for (let i = block.start - 1; i <= block.end; ++i) {
					this.codeMirror.addLineClass(i, "background", "line-javascript")
				}

			} else if (block.type === BlockType.HTTP_REQUEST && block.payload != null) {
				const pageContent = lines.slice(block.payload.start, block.payload.end + 1).join("\n")
				let pretty: null | string = null

				try {
					pretty = JSON.stringify(JSON.parse(pageContent), null, 2)
				} catch (e) {
					// If the JSON is invalid, we can't prettify it.
				}

				if (pretty != null && pageContent !== pretty) {
					const el = document.createElement("span")
					el.classList.add("icon")
					el.innerText = "{}"
					el.title = "Prettify JSON body."
					el.dataset.start = block.payload.start.toString()
					el.dataset.end = block.payload.end.toString()
					el.dataset.pretty = pretty
					el.addEventListener("click", this.onPrettifyClicked)
					this.codeMirror.setGutterMarker(block.payload.start, "prestige", el)
				}

			}

