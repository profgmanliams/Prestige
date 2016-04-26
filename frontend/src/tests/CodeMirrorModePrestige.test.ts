import CodeMirror from "codemirror"
import "codemirror/addon/runmode/runmode"

// Following line is required so that Prestige mode's definition is loaded.
import "_/codemirror"

const prestigeMode = CodeMirror.getMode(CodeMirror.defaults, "prestige")
const javascriptCustomMode = CodeMirror.getMode(CodeMirror.defaults, "javascript-custom")

type TokenTuple = [style: null | string, text: string]

// Code taken from the official runMode addon of CodeMirror.
function runMode(lines: string[], mode: CodeMirror.Mode<unknown>): TokenTuple[] {
	lines = CodeMirror.splitLines(lines.join("\n"))
	const tokens: TokenTuple[] = []
	const state = CodeMirror.startState(mode)

	for (let i = 0, e = lines.length; i < e; ++i) {
		if (i) {
			tokens.push([null, "\n"])
		}
		const stream = new (CodeMirror as any).StringStream(lines[i], null, {
			lookAhead(n: number) {
				return lines[i + n]
			},
		})
		if (!stream.string && mode.blankLine) {
			mode.blankLine(state)
		}
		while (!stream.eol()) {
			const style = mode.token(stream, state)
			tokens.push([style ?? null, stream.current()])
			stream.start = stream.pos
		}
	}

	return tokens
}

function runModePrestige(lines: string[]): TokenTuple[] {
	return runMode(lines, prestigeMode)
}

test("simple sheet", async () => {
	const tokens = runModePrestige([
		"GET https://httpbun.com/get",
	])
	expect(tokens).toEqual([
		["def", "GET "],
		["string", "https://httpbun.com/get"],
	])
})

test("comment with a link", async () => {
	const tokens = runModePrestige([
		"# Go to https://httpbun.com to find out!",
	])
	expect(tokens).toEqual([
		["comment", "# Go to "],
		["link", "https://httpbun.com"],
		["comment", " to find out!"],
	])
})

test("request with headers", async () => {
	const tokens = runModePrestige([
		"GET https://httpbun.com/headers",
		"Content-Type: application/json",
		"X-More-Stuff: more stuff value here",
	])
	expect(tokens).toEqual([
		["def", "GET "],
		["string", "https://httpbun.com/headers"],
		[null, "\n"],
		["keyword", "Content-Type"],
		[null, ": "],
		["attribute", "application/json"],
		[null, "\n"],
		["keyword", "X-More-Stuff"],
		[null, ": "],
		["attribute", "more stuff value here"],
	])
})

test("request with javascript with template string in body", async () => {
	const tokens = runModePrestige([
		"POST https://httpbun.com/post",
		"",
		"= `abc ${1+2} def`",
	])
	expect(tokens).toEqual([
		["def", "POST "],
		["string", "https://httpbun.com/post"],
		[null, "\n"],
		[null, "\n"],
		[null, "= "],
		["string-2", "`abc ${"],
		["number", "1"],
