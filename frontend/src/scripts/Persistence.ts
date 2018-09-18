import m from "mithril"
import Stream from "mithril/stream"
import type { User } from "_/AuthService"
import AuthService from "_/AuthService"
import { GIST_API_PREFIX, storageUrl } from "_/Env"
import ModalManager from "_/ModalManager"
import Button from "_/Button"
import GitHubAuthButton from "_/GitHubAuthButton"
import Toaster from "_/Toaster"

const STORAGE_URL_BASE = storageUrl()

export type Source =
	LocalSource
	| CloudSource
	| GistSource

interface BaseSource {
	type: string
	title: string
}

interface LocalSource extends BaseSource {
	type: "browser"
	details: {
		prefix: string
	}
}

interface CloudSource extends BaseSource {
	type: "cloud"
}

interface GistSource extends BaseSource {
	type: "gist"
}

type SheetPath = string

export const enum SaveState {
	unchanged,
	unsaved,
	saving,
	saved,
}

export class Sheet {
	path: SheetPath
	name: string
	body: string
	saveState: SaveState

	constructor(path: SheetPath, body: string) {
		this.path = path
		this.name = path
		this.body = body
		this.saveState = SaveState.unchanged
	}
}

type SheetEntry = Pick<Sheet, "path" | "name">

export abstract class Provider<S extends Source> {
	key: string
	source: S
	entries: SheetEntry[]
	isManualSave: boolean

	constructor(key: string, source: S, isManualSave = false) {
		this.key = key
		this.source = source
		this.entries = []
		this.isManualSave = isManualSave
		this.create = this.create.bind(this)
	}

	abstract loadRootListing(): Promise<void>

	abstract load(sheetPath: SheetPath): Promise<Sheet>

	abstract autoSave(sheet: Sheet): Promise<void>

	manualSave(sheet: Sheet): Promise<void> {
		return this.autoSave(sheet)
	}

	abstract create(): Promise<void>

	abstract delete(path: string): Promise<void>

	abstract render(): m.Children
}

class BrowserProvider extends Provider<LocalSource> {
	get prefix() {
		return this.source.details.prefix
	}

	async loadRootListing(): Promise<void> {
		const paths: SheetEntry[] = []
		for (let i = 0; i < localStorage.length; ++i) {
			const key = localStorage.key(i)
			if (key?.startsWith(this.prefix) && key.endsWith(":name")) {
				const path = key.substring(this.prefix.length, key.length - ":name".length)
				paths.push({ path, name: localStorage.getItem(key) ?? path })
			}
		}
		this.entries = paths
	}

	async load(sheetPath: SheetPath): Promise<Sheet> {
		const pathPrefix = this.prefix + sheetPath
		const body = localStorage.getItem(pathPrefix + ":body") ?? ""
		return new Sheet(sheetPath, body)
	}

	async autoSave({ path, name, body }: Sheet): Promise<void> {
		localStorage.setItem(this.prefix + path + ":name", name)
		localStorage.setItem(this.prefix + path + ":body", body)
	}

	async create(): Promise<void> {
		const name = window.prompt("Sheet Name") ?? ""
		if (name === "") {
			return
		}
		const path = name
		localStorage.setItem(this.prefix + path + ":name", name)
		localStorage.setItem(this.prefix + path + ":body", "")
		await this.loadRootListing()
	}

	delete(path: string): Promise<void> {
		// TODO: Iterate over all of localStorage and delete all keys with path as prefix.
		localStorage.removeItem(this.prefix + path + ":name")
		localStorage.removeItem(this.prefix + path + ":body")
		localStorage.removeItem(this.prefix + path + ":cookieJar")
		return this.loadRootListing()
	}

	render(): m.Children {
		return [
			m(
				"a.pv1.ph2.db",
				{
					onclick: this.create,
					href: "#",
				},
				"+ Create new",
			),
			m("ul", [
				this.entries.map(entry => {
					const href = `/doc/${ this.key }/${ entry.path }`
					return m(
						"li",
						[
							m(
								m.route.Link,
								{
									href,
									class: window.location.hash.substring(2) === href ? "active" : "",
								},
								entry.name,
							),
							/* Deleting UI should be elsewhere.
							m(
								Button,
								{
									class: "compact danger-light",
									onclick(event: Event) {
										console.log("Deleting", entry)
										provider.delete(entry.path)
										event.preventDefault()
									},
								},
								"Del",
							),
						   //*/
						],
					)
				}),
			]),
		]
	}
}

class CloudProvider extends Provider<CloudSource> {
	async loadRootListing(): Promise<void> {
		const currentUser = AuthService.currentUser()

		if (currentUser == null) {
			throw new Error("Cannot browse sheets on cloud, since user not logged in.")
		}

		const response = await m.request<{ ok: boolean, entries: { name: string, slug: string }[] }>({
			method: "GET",
			url: STORAGE_URL_BASE,
			withCredentials: true,
		})

		const entries = []
		for (const item of response.entries) {
			entries.push({ path: item.slug, name: item.name })
		}

		this.entries = entries
	}

	async load(sheetPath: SheetPath): Promise<Sheet> {
		const currentUser = AuthService.currentUser()

		if (currentUser == null) {
			throw new Error("Cannot load sheets on cloud, since user not logged in.")
		}

		const response = await m.request<{ body: string }>({
			method: "GET",
			url: STORAGE_URL_BASE + sheetPath,
			withCredentials: true,
		})

		return new Sheet(sheetPath, response.body)
	}

	async autoSave(sheet: Sheet): Promise<void> {
		const currentUser = AuthService.currentUser()

		if (currentUser == null) {
			throw new Error("Cannot load sheets on cloud, since user not logged in.")
		}

		// TODO: Verify if the save was successful.
		await m.request({
			method: "PATCH",
			url: STORAGE_URL_BASE + sheet.path,
			withCredentials: true,
			body: {
				body: sheet.body,
			},
		})
	}

	async create(): Promise<void> {
		const name = window.prompt("Sheet path:")
		await m.request({
			method: "POST",
			url: STORAGE_URL_BASE + name,
			withCredentials: true,
			body: {
				name,
			},
		})
		await this.loadRootListing()
	}

	delete(path: string): Promise<void> {
		return m.request({
			method: "DELETE",
			url: STORAGE_URL_BASE + path,
			withCredentials: true,
		})
			.then(() => this.loadRootListing())
	}

	render(): m.Children {
		return "Deprecated?"
	}
}

interface Gist {
	id: string
	name: string
	owner: string
	description: string
	path: string
	readme: GistFile
	files: GistFile[]
}

interface GistFile {
	name: string
}

export class GistProvider extends Provider<GistSource> {
	private gists: Record<string, Gist>

	constructor(key: string, source: GistSource) {
		super(key, source, true)
		this.gists = {}
	}

	verifyUser(): User {
		const currentUser = AuthService.currentUser()

		if (currentUser == null) {
			throw new Error("User not logged in, cannot browse documents on Gist.")
		}

		if (!AuthService.isGistAvailable()) {
			throw new Error("GitHub not connected for logged in user, cannot browse documents on Gist.")
		}

		return currentUser
	}

	async loadRootListing(): Promise<void> {
		try {
			this.verifyUser()
		} catch (error) {
			return
		}

		let response: {
			gists: Gist[]
		}

		try {
			response = await m.request<typeof response>({
				method: "GET",
				url: GIST_API_PREFIX,
				withCredentials: true,
			})

		} catch(error: unknown) {
			const { code } = (error as any).response.error
			if (code === "gist-access-revoked") {
				AuthService.isGistAvailable(false)
				Toaster.push(
					"danger",
					"Access to Gist appears to have been revoked. Please re-authorize from the Profile menu.",
				)
				return
			}

			throw error

		}

		this.entries = []
		for (const gist of response.gists) {
			if (gist.readme != null && gist.files?.length > 0) {
				gist.path = `${ gist.owner }/${ gist.name }`
				this.gists[gist.name] = gist
			}
		}
	}

	async clearListing() {
		this.gists = {}
	}

	async load(sheetPath: SheetPath): Promise<Sheet> {
		const response = await m.request<string>({
			method: "GET",
			url: GIST_API_PREFIX + "get-file/" + sheetPath,
			withCredentials: true,
			responseType: "text",
			deserialize(data) {
				return data
			},
		})

		return new Sheet(sheetPath, response)
	}

