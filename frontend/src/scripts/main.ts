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
					"We are moving to a new domain (prestige.dev). Please use the following link to download your local data from this domain, and import it on ",
					m("a", { href: "https://prestige.dev" }, "prestige.dev"),
					".",
				]),
				m("a", {
					href: "data:text/plain;charset=utf-8," + encodeURIComponent(JSON.stringify(exportLocalStorage())),
					download: "prestigemad-data.json",
				}, "Download export data"),
			]),
		]
	},
}

function WorkspaceView(): m.Component {
	const workspace = new Workspace()
	let redrawCount = 0

	const enum VisiblePopup {
		AboutPane,
		ColorPalette,
		Cookies,
		FileBucketPopup,
		LoginForm,
		None,
	}

	let popup: VisiblePopup = VisiblePopup.None

	return {
		view,
		oncreate,
		onremove,
		oninit: loadSheet,
		onupdate: loadSheet,
	}

	function loadSheet(vnode: VnodeDOM<{ path: string }>) {
		if (workspace.currentSheetQualifiedPath() !== vnode.attrs.path) {
			workspace.currentSheetQualifiedPath(vnode.attrs.path)
			popup = VisiblePopup.None
		}
	}

	function oncreate() {
		document.addEventListener("keydown", onKeyDown)
	}

	function onremove() {
		document.removeEventListener("keydown", onKeyDown)
	}

	function onKeyDown(event: KeyboardEvent) {
		if (event.key === "Escape") {
			ModalManager.close()
			if (popup !== VisiblePopup.None) {
				popup = VisiblePopup.None
				m.redraw()
			}
			workspace.codeMirror?.focus()

		} else if ((event.ctrlKey || event.metaKey) && event.key === "s") {
			event.preventDefault()
			if (isManualSaveAvailable()) {
				workspace.saveSheetManual()
			} else {
				workspace.saveSheetAuto()
			}
			m.redraw()

		}
	}

	function view() {
		const authState = AuthService.getAuthState()
		return m("section.top-layout", [
			m("header", [
				m(".flex.items-end", [
					m("h1.f3.mh2.mv0", "Prestige"),
					m(".f6.i.ml3", "An HTTP client."),
				]),
				m(".flex.items-stretch", [
					RepoStats.stars > 0 && m(".pv1.ph2.db.flex.items-center.silver", [
						m(
							NavLink,
							{ href: REPO_URL, title: "Star Prestige on GitHub" },
							[m(Icons.github), "Star: ", RepoStats.stars, m(Icons.arrowSquareOut)],
						),
					]),
					workspace.saveState === SaveState.unsaved
					&& m(".i.pv1.ph2.db.flex.items-center.silver", "Unsaved"),
					workspace.saveState === SaveState.saving
					&& m(".i.pv1.ph2.db.flex.items-center.silver", m.trust("Saving&hellip;")),
					Env.isDev() && m(
						"code.flex.items-center.ph1",
						{ style: { lineHeight: 1.15, color: "var(--red-3)", background: "var(--red-9)" } },
						["R", ++redrawCount],
					),
					Env.isDev() && m(
						NavLink,
						{ onclick: onColorPaletteToggle, isActive: ModalManager.isShowing(VisiblePopup.ColorPalette) },
						"Palette",
					),
					m(
						NavLink,
						{
							class: "t-cookies-toggle-btn",
							onclick: onCookiesToggle,
							isActive: ModalManager.isShowing(VisiblePopup.Cookies),
						},
						[
							m(Icons.cookie),
							`Cookies (${ workspace.cookieJar?.size ?? 0 })`,
						],
					),
					m(
						NavLink,
						{ onclick: onFileBucketToggle, isActive: ModalManager.isShowing(VisiblePopup.FileBucketPopup) },
						[
							m(Icons.folderClosed),
							`FileBucket (${ workspace.fileBucket.size })`,
						],
					),
					[
						authState === AuthState.PENDING
							? [m(Icons.user), m(Icons.spinner, { style: "bold" })]
							: m(
								NavLink,
								{
									class: "t-login-signup-btn",
									onclick: onLoginFormToggle,
									isActive: ModalManager.isShowing(VisiblePopup.LoginForm),
								},
								[
									m(Icons.user),
									authState === AuthState.LOGGED_IN ? "Profile" : "LogIn/SignUp",
								],
							),
					],
					m(
						NavLink,
						{ onclick: onAboutPaneToggle, isActive: ModalManager.isShowing(VisiblePopup.AboutPane) },
						[
							m(Icons.info),
							"About",
						],
					),
					m(NavLink, { href: "/docs/" }, [m(Icons.question), "Docs", m(Icons.arrowSquareOut)]),
					m(
						NavLink,
						{ href: REPO_URL + "/issues/new" },
						["Report a problem", m(Icons.arrowSquareOut)],
					),
				]),
			]),
			m(Sidebar, { workspace }),
			// The order of the below is a bit unintuitive, but is needed.
			// Firstly, the parent element of these two, is a grid container. So layout can be different from order.
			// Secondly, we need editor's layout to change, depending on result-pane's existence. So, we need these two
			// ... to be next to each other in this order, so that a `+` selector works for layout change.
			m(ResultPane, { workspace }),
			m(EditorPane, { workspace }),
		])
	}

	function onAboutPaneToggle() {
		ModalManager.toggleDrawer(
			() => m(ModalManager.DrawerLayout, { title: "About" }, m(AboutModal)),
			VisiblePopup.AboutPane,
		)
	}

	function onCookiesToggle() {
		ModalManager.toggleDrawer(
			() => m(CookiesModal, { cookieJar: workspace.cookieJar, workspace }),
			VisiblePopup.Cookies,
		)
	}

	function onFileBucketToggle() {
		ModalManager.toggleDrawer(
			() => m(FileBucketModal, { fileBucket: workspace.fileBucket }),
			VisiblePopup.FileBucketPopup,
		)
	}

	function onLoginFormToggle() {
		ModalManager.toggleDrawer(() => m(LoginFormModal), VisiblePopup.LoginForm)
	}

	function onColorPaletteToggle() {
		ModalManager.toggleDrawer(() => m(ColorPaletteModal), VisiblePopup.ColorPalette)
	}
}

function EditorPane(): m.Component<{ class?: string, workspace: Workspace }> {
	return { view, oncreate }

	function oncreate(vnode: VnodeDOM<{ class?: string, workspace: Workspace }>): void {
		if (!(vnode.dom.firstElementChild instanceof HTMLElement)) {
			throw new Error(
				"CodeMirror for Editor cannot be initialized unless `vnode.dom.firstElementChild` is an HTMLElement.",
			)
		}

		const bodyEl = vnode.dom.querySelector(".body")
		if (bodyEl != null) {
			vnode.attrs.workspace.initCodeMirror(bodyEl as HTMLElement)
		} else {
			throw new Error("Unable to find body element in editor pane for initializing CodeMirror.")
		}
	}

	function view(vnode: VnodeDOM<{ class?: string, workspace: Workspace }>): m.Vnode {
		const { workspace } = vnode.attrs
		workspace.doFlashes()
		workspace.codeMirror?.refresh()

		let saveButtonSpace: m.Children

		if (!isManualSaveAvailable()) {
			saveButtonSpace = m("em.pa1", "Autosaved")

		} else {
			saveButtonSpace = m(".stack-view", [
				m(
					NavLink,
					{
						onclick: () => {
							workspace.saveSheetManual()
						},
					},
					[m(Icons.floppyDisk, { style: "bold" }), "Save document"],
				),
