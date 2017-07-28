import m from "mithril"
import Stream from "mithril/stream"

const PREFIX = "option:"

type DisplayMode = "auto" | "light" | "dark"

const displayModeOption: Stream<DisplayMode> = Stream()
const isPrefersDark: Stream<boolean> = Stream(window.matchMedia("(prefers-color-scheme: dark)").matches)

displayModeOption.map((value: DisplayMode) => {
	updateIsDark()
	// Following meta property changes color of native UI controls in Chrome. No Firefox support yet.
	const colorSchemeMeta = document.head.querySelector("meta[name=color-scheme]")
	if (colorSchemeMeta instanceof HTMLMetaElement) {  // Also does a null-check.
		colorSchemeMeta.content = value === "auto" ? "light dark" : value
	}
})
initOption(displayModeOption, "displayMode", "auto")

window.matchMedia("(prefers-color-scheme: dark)").addListener(event => {
	isPrefersDark(event.matches)
})
isPrefersDark.map(updateIsDark)

function updateIsDark() {
	const modeValue = displayModeOption()
	const isPrefersDarkValue = isPrefersDark()
	const isDark = modeValue === "auto" ? isPrefersDarkValue : (modeValue === "dark")
	document.body.classList[isDark ? "add" : "remove"]("dark")
}

const paletteOption: Stream<string> = Stream()
paletteOption.map((value: string) => {
	document.body.dataset.palette = value
})
initOption(paletteOption, "palette", "base16")

const editorFontOption: Stream<string> = Stream()
editorFontOption.map(m.redraw)
initOption(editorFontOption, "editorFont", "Source Code Pro")

const editorFontSizeOption: Stream<string> = Stream()
editorFontSizeOption.map(m.redraw)
initOption(editorFontSizeOption, "editorFontSize", "14")

export const styleOverrides: Stream<string> = Stream.lift((displayMode, editorFont, editorFontSize) => {
	return [
		":root {",
		// Ref: <https://developer.mozilla.org/en-US/docs/Web/CSS/color-scheme>.
		"color-scheme: " + (displayMode === "auto" ? "light dark" : displayMode) + ";",
		"--monospace-font: " + (editorFont === "default" ? "monospace" : `'${editorFont}'`) + ";",
		"--monospace-font-size: " + editorFontSize + "px;",
		"}",
	].join("\n")
}, displayModeOption, editorFontOption, editorFontSizeOption)

function load<T>(name: string): null | T {
	const rawValue = localStorage.getItem(PREFIX + name)
	try {
		return rawValue != null ? JSON.parse(rawValue) : null
	} catch (error) {
		localStorage.removeItem(PREFIX + name)
		return null
	}
}

function save<T>(name: string, value: T): void {
	const valueString: string = JSON.stringify(value)

