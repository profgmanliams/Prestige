import m from "mithril"
import Workspace from "../scripts/Workspace"

console.log = jest.fn()

jest.mock("mithril")
const mockedRequestFn = m.request as jest.Mock

test("execute direct get", async () => {
	const workspace = new Workspace()
	workspace.defaultProxy = null

	mockedRequestFn.mockResolvedValue({
		status: 200,
		statueText: "OK",
		url: "http://httpbun.com/get?first=first-value",
		headers: [],
		body: "response body",
	})

	expect(workspace instanceof Workspace).toBeTruthy()

	const result = await workspace.execute({
		method: "GET",
		url: "http://httpbun.com/get?first=first-value",
		bodyType: "raw",
		body: "",
		headers: new Headers(),
	}, null)

