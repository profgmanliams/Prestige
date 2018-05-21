import { buildQueryString } from "mithril"
import interpolate from "_/interpolate"
import type Context from "_/Context"
import { MultiPartForm } from "_/BodyTypes"

export interface RequestDetails {
	method: string
	url: string
	headers: Headers
	bodyType: string
	body: string
}

const AsyncFunction = Object.getPrototypeOf(async () => 0).constructor

export async function extractRequest(lines: string[], runLineNum: number, context: Context): Promise<RequestDetails> {

	const structure: Block[] = parse(lines)
	console.log("structure", structure)

	const scriptBlocks: JavascriptBlock[] = []
	let requestBlock: null | HttpRequestBlock = null

	for (const block of structure) {
		if (block.start > runLineNum) {
			// This block is completely below the runLineNum.
			break
		}

		if (block.type === BlockType.JAVASCRIPT) {
			if (block.end >= runLineNum) {
				throw new Error("Can't execute from inside a script block.")
			} else {
				scriptBlocks.push(block)
			}

		} else if (block.type === BlockType.HTTP_REQUEST && block.end >= runLineNum) {
			requestBlock = block
			break

		}
	}

	if (requestBlock == null) {
		throw new Error("Couldn't identify the request to be run.")
	}

	for (const block of scriptBlocks) {
		const code = lines.slice(block.start, block.end + 1).join("\n")
		await (new AsyncFunction(code).call(context))
	}

	const details = {
		method: "GET",
		url: "",
		bodyType: "raw",
		body: "",
		headers: new Headers(),
	}

	const renderedLines = interpolate(
		lines.slice(requestBlock.header.start, requestBlock.header.end + 1).join("\n"),
		context,
	).split("\n")
	const [method, ...urlParts] = renderedLines[0].split(/\s+/)
