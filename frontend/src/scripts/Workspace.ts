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
