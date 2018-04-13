interface Morsel {
	value: string;
	expires: string;
}

type Host = string
type Path = string
type Name = string
export type StoreType = Record<Host, Record<Path, Record<Name, Morsel>>>

export default class CookieJar {
	store: StoreType
	size: number
	sheetPath: null | string

	constructor(store: StoreType = {}, sheetPath: null | string = null) {
		this.store = store ?? {}
		this.size = 0
		this.sheetPath = sheetPath

		this.recomputeSize()
	}

	static loadOrCreate(sheetPath: string): CookieJar {
		const serializedCookies = localStorage.getItem("cookies:" + sheetPath)
		if (serializedCookies != null && serializedCookies !== "") {
			try {
				return new CookieJar(JSON.parse(serializedCookies), sheetPath)
			} catch (error) {
				console.error("Unable to load cookies for path", sheetPath, error)
				return new CookieJar({}, sheetPath)
			}
		} else {
			return new CookieJar({}, sheetPath)
		}
	}

	clear(): void {
		this.store = {}
		this.size = 0
		this.save()
	}

	// Not used directly anywhere, but needed for CookieJar objects to be JSON-serializable, which is required.
	toJSON(): StoreType {
		return this.store
	}

	save(): void {
		if (this.sheetPath != null) {
			localStorage.setItem("cookies:" + this.sheetPath, JSON.stringify(this))
		}
	}

	overwrite(newCookies: null | StoreType): { added: number, modified: number, removed: number, any: boolean } {
		let modified = 0
		let removed = 0

