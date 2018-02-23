import interpolate from "../scripts/interpolate"

test("access context from this", async () => {
	expect(interpolate(
		"Hello ${ this.greeting }",
		{ greeting: "abc" },
	)).toBe("Hello abc")
})

test("data properties in scope", async () => {
	expect(interpolate(
