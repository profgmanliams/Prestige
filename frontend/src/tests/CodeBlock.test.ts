import { render } from "./utils"
import CodeBlock from "_/CodeBlock"

test("CodeBlock plain text", async () => {
	const root = render(CodeBlock, { text: "some plain text" })
	const el = root.querySelector("pre")
	expect(el).toBeDefined()
	if (el == null) {
		return
	}
	expect(getCodeTags(el))
