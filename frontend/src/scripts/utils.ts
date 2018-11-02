export function isPromise(object: unknown): object is Promise<unknown> {
	return object != null && typeof (object as Promise<unknown>).then === "function"
}

export function copyToClipboard(text: string): void {
	const el = document.createElement("textarea")
	el.style.position = "fixed"
	el.style.opacity = el.style.top = el.style.left = "0"
	el.style.pointerEvents = "none"
	document.body.append(el)
	el.value = text
	el.select()
	document.execCommand("copy")
	el.remove()
}
