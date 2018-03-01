import m from "mithril"
import type Workspace from "_/Workspace"
import { AnyResult } from "_/HttpSession"
import { isPromise } from "_/utils"
import type FileBucket from "_/FileBucket"
import type CookieJar from "_/CookieJar"
import { MultiPartForm } from "_/BodyTypes"
import type { MultiPartFormValue } from "_/BodyTypes"
import type { RequestDetails } from "_/Parser"
import Toaster from "_/Toaster"

type EventCallback = (..._: unknown[]) => unknown

export default class Context {
	private data: Record<string, unknown>
	private handlers: Map<string, Set<EventCallback>>
	private workspace: null | Workspace
	private cookieJar: null | CookieJar
	private fileBucket: null | FileBucket
	secrets: Record<string, string>
	getProxyUrl: null | ((request: RequestDetails) => null | string)

