import { expect, test } from "@playwright/test"
import { editorRun, setEditorText } from "./utils"

test("Load Prestige", async ({ page }) => {
	await page.goto("/")
	await expect(page).toHaveTitle(/Prestige/)
})

test("Cookies UI reflect responses", async ({ page }) => {
	await page.goto("/")

	await setEditorText(page, "GET http://localhost:3043/cookies/set?detective=sherlock")
	await editorRun(page)
	await page.waitForSelector(".result-pane")

	await expect(page.locator(".t-response-status")).toHaveText(["200 Ok", "302 Found"])

	await page.click(".t-cookies-toggle-btn")

	const tr = page.locator(".t-cookies-table tbody tr")
	await expect(tr).toHaveCount(1)

	await expect(tr.locator("> *").allInnerTexts()).resolves.toEqual([
		"1",
		"localhost:3043",
