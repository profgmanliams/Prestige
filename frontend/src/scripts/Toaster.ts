import m from "mithril"

export interface Toast {
	id: number
	type: "success" | "danger" | "loading"
	message: string
	endTime?: number
}

let nextId = 1

class Toaster {
	toasts: Toast[]

	constructor() {
		this.toasts = []
		this.onCloseBtnClicked = this.onCloseBtnClicked.bind(this)
	}

	push(type: Toast["type"], message: Toast["message"]): void
	push(t: Partial<Toast>): void

	push(type: Partial<Toast> | Toast["type"], message?: Toast["message"]): void {
		const id = nextId++
		let t: Toast
		if (typeof type === "string") {
			t = {
				id,
				type: type,
				message: message ?? "N/A",
				endTime: Date.now() + 6000,
			}
		} else {
			t = {
				id,
				type: "danger",
				message: "N/A",
				endTime: Date.now() + 6000,
