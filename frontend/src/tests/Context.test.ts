import Context from "_/Context"
import Workspace from "_/Workspace"
import HttpSession from "_/HttpSession"
import CookieJar from "_/CookieJar"
import FileBucket from "_/FileBucket"
import Toaster from "_/Toaster"

console.log = jest.fn()

jest.mock("_/HttpSession")

beforeEach(() => {
	(HttpSession as jest.Mock).mockClear()
})

test("basic auth header generation", () => {
	const cookieJar = new CookieJar()
	const fileBucket = new FileBucket()
	const context = new Context(new Workspace(), cookieJar, fileBucket, {})

	expect(context.basicAuth("user", "pass"))
		.toBe("Basic dXNlcjpwYXNz")

	expect(context.basicAuth("another user", "another password"))
		.toBe("Basic YW5vdGhlciB1c2VyOmFub3RoZXIgcGFzc3dvcmQ=")
})

test("event system in contexts", () => {
	const cookieJar = new CookieJar()
	const fileBucket = new FileBucket()
	const context = new Context(new Workspace(), cookieJar, fileBucket, {})
