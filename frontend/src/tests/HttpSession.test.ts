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
