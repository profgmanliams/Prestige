import m from "mithril"
import { render } from "./utils"
import Button from "../scripts/Button"

test("button default", async () => {
	const root = render(Button)
	const buttonEl = root.querySelector("button")
	expect(buttonEl).toBeDefined()
	expect(buttonEl?.className).toBe("")
	expect(buttonEl?.type).toBe("button")
})

test("button primary", async () => {
	const root = render(Button, { style: "primary" })
	const buttonEl = root.querySelector("button")
