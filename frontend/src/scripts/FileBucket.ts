import type { MultiPartFormValue } from "_/BodyTypes"

export default class FileBucket {
	private files: Map<string, File>

	constructor() {
		this.files = new Map()
	}

	set(name: string, file: File): void {
		this.files.set(name, file)
	}

	del(name: string): void {
		this.files.delete(name)
	}

	get(name: string): File | null {
		return this.files.get(name) ?? null
	}

	load(name: string): Promise<MultiPartFormValue> {
		const file = this.get(name)

		if (file == null) {
			throw new Error("File not available: " + name)
		}

		console.log("file", file)
		const fileReader = new FileReader()
