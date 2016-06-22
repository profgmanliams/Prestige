import type { Vnode, VnodeDOM } from "mithril"
import m from "mithril"
import { styleOverrides } from "_/Options"
import Workspace from "_/Workspace"
import AuthService, { AuthState } from "_/AuthService"
import * as Icons from "_/Icons"
import CookiesModal from "_/CookiesModal"
import LoginFormModal from "_/AuthModal"
import FileBucketModal from "_/FileBucketModal"
import ColorPaletteModal from "_/ColorPaletteModal"
import NavLink from "_/NavLink"
import ResultPane from "_/ResultPane"
import Sidebar from "_/Sidebar"
import * as Env from "_/Env"
import Toaster from "_/Toaster"
import ExternalLink from "_/ExternalLink"
import ModalManager from "_/ModalManager"
import Toolbar from "_/Toolbar"
import type { GistProvider } from "_/Persistence"
import { currentSheet, getProvider, isManualSaveAvailable, SaveState } from "_/Persistence"
import Rollbar from "rollbar"

const REPO_URL = "https://github.com/sharat87/prestige"

window.addEventListener("load", main)
window.addEventListener("error", onWindowError)
window.addEventListener("unhandledrejection", onUnhandledRejection)

function main() {
	if (window.location.host === "prestigemad.com" && Object.keys(localStorage).find(k => k.startsWith("instance:")) == null) {
		window.location.href = "https://prestige.dev"
		return
	}

	if (Env.rollbarToken != null) {
		console.info("Enabling Rollbar with environment", Env.name)
		Rollbar.init({
			accessToken: Env.rollbarToken,
			captureUncaught: true,
			captureUnhandledRejections: true,
			payload: {
				environment: Env.name,
			},
		})
	}

	const root = document.createElement("main")
	root.setAttribute("id", "app")
	document.body.appendChild(root)
	document.getElementById("loadingBox")?.remove()

	applyCookieStorageMigration()

	m.route(root, "/doc/browser/master", {
		"/doc/:path...": {
			render: (vnode: Vnode) => m(Layout, m(WorkspaceView, vnode.attrs)),
		},
		// TODO: "/:404...": errorPageComponent,
	})

	AuthService.check()

	interface GitHubApiResponse {
		stargazers_count: number
	}

	m.request<GitHubApiResponse>(
		`${ Env.EXT_URL_PREFIX }https://api.github.com/repos/sharat87/prestige`,
	).then((response) => {
		RepoStats.stars = response.stargazers_count
	})
}

function onWindowError(event: ErrorEvent) {
	// Ref: <https://developer.mozilla.org/en-US/docs/Web/API/Window/error_event>.
	if (event instanceof UIEvent) {
		// Error was generated from a UI element.
		Toaster.push("danger", `UI: ${ event.type }: ${ event.message }`)
	} else {
		// Non-UI error.
		Toaster.push("danger", `${ event.type }: ${ event.message }`)
	}
	// Manual redraw since this event handler is not managed by Mithril.
	m.redraw()
}

function onUnhandledRejection(event: { promise: Promise<unknown>, reason: unknown }) {
	// Don't do any error specific special handling here. That should be done at the source of the error.
	// Ref: <https://developer.mozilla.org/en-US/docs/Web/API/Window/unhandledrejection_event>.
	Toaster.push("danger", `${ event.reason } (UR)`)
	// Manual redraw since this event handler is not managed by Mithril.
	m.redraw()
}

const RepoStats = {
	stars: 0,
}

function exportLocalStorage() {
	const data: Record<string, string> = {}
	for (const [key, value] of Object.entries(localStorage)) {
		data[key] = value
	}
	return data
}

const Layout: m.Component = {
	view(vnode: m.VnodeDOM): m.Children {
		return [
			vnode.children,
			ModalManager.render(),
			Toaster.render(),
			m("style", styleOverrides()),
			window.location.host === "prestigemad.com" && m("div.old-domain-notice", [
				m("h2", "Hey!"),
				m("p", [
