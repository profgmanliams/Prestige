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
				...type,
			}
		}
		this.toasts.push(t)
		if (t.endTime != null) {
			setTimeout(() => this.remove(id), t.endTime - Date.now())
		}
	}

	pushLoadingToast(message: string): number {
		const id = nextId++
		this.toasts.push({
			id,
			type: "loading",
			message,
		})
		return id
	}

	remove(id: number): void {
		this.toasts.splice(
			this.toasts.findIndex(t => t.id === id),
			1,
		)
		m.redraw()
	}

	render(): m.Children {
		return m(
			".toasts.pa4.fixed.right-0.top-0",
			{
				onclick: this.onCloseBtnClicked,
			},
			this.toasts.map(toast => m(
				".f5.pa3.mb2.br2.shadow-2",
				{
					class: {
						success: "bg-washed-green dark-green",
						danger: "bg-washed-red dark-red",
