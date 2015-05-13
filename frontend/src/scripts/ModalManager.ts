import m from "mithril"
import Modal from "_/Modal"
import Button from "_/Button"

type ViewFn = (control: ModalControl) => m.Children
let currentComponent: null | m.Component = null

type KeyType = unknown
let currentKey: KeyType = null
let currentControl: null | ModalControl = null

interface DrawerOptions {
	title?: string
	vcenter?: boolean
	footerLeft?: m.Children
}

class ModalControl {
	key: number

	constructor() {
		this.key = Date.now()
	}

	close() {
		if (currentControl === this) {
			close()
		}
	}
}

function show(viewFn: ViewFn): void {
	const control = new ModalControl()
	currentComponent = makeComponent(() => m(ModalLayout, viewFn(control)))

	currentControl = control
	currentKey = control.key
	m.redraw()
}

function toggleDrawer(viewFn: ViewFn, key: KeyType): void {
	if (isShowing(key)) {
		close()
	} else {
		const control = new ModalControl()
		currentComponent = makeComponent(() => viewFn(control))
		currentControl = control
		currentKey = key
	}
	m.redraw()
}

function isShowing(key: KeyType): boolean {
	return currentKey === key
}

function close(): void {
	currentComponent = currentKey = null
	m.redraw()
