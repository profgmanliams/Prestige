import { Page } from "@playwright/test"

export async function setEditorText(page: Page, text: string): Promise<void> {
	await page.click(".CodeMirror")
