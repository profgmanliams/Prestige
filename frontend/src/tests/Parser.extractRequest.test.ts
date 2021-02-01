import { extractRequest } from "../scripts/Parser"
import Context from "_/Context"

jest.mock("_/Context")
jest.mock("_/Workspace")

console.log = jest.fn()

function makeMockContext() {
	return new Context(null, null, null, {})
}

test("single line input with one request", async () => {
	const context = makeMockContext()

	const request = await extractRequest([
		"GET http://httpbun.com",
	], 0, context)

	expect(request).toBeDefined()
	expect(request.method).toBe("GET")
	expect(request.url).toBe("http://httpbun.com")
})

test("get request on first and only non-blank line", async () => {
	const context = makeMockContext()

	const request = await extractRequest([
		"GET http://httpbun.com",
		"",
	], 0, context)

	expect(request).toBeDefined()
	expect(request.method).toBe("GET")
	expect(request.url).toBe("http://httpbun.com")
})

test("get request with blank lines around", async () => {
	const context = makeMockContext()

	const request = await extractRequest([
		"",
		"GET http://httpbun.com",
		"",
	], 1, context)

	expect(request).toBeDefined()
	expect(request.method).toBe("GET")
	expect(request.url).toBe("http://httpbun.com")
})

test("get request with one query param", async () => {
	const context = makeMockContext()

	const request = await extractRequest([
		"GET http://httpbun.com/get",
		"  name=sherlock",
	], 0, context)

	expect(request).toBeDefined()
	expect(request.method).toBe("GET")
	expect(request.url).toBe("http://httpbun.com/get?name=sherlock")
})

test("get request with query param with special characters", async () => {
	const context = makeMockContext()

	const request = await extractRequest([
