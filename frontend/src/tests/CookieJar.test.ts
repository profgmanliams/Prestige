import CookieJar from "../scripts/CookieJar"

test("starts with empty jar", () => {
	const jar = new CookieJar()
	expect(jar.size).toBe(0)
})

test("add single domain cookies", () => {
	const jar = new CookieJar()

	const counts = jar.overwrite({
		host1: {
			"/": {
				name11: { value: "value11", expires: "" },
				name12: { value: "value12", expires: "" },
			},
		},
	})

	expect(jar.size).toBe(2)
	expect(counts).toStrictEqual({ added: 2, modified: 0, removed: 0, any: true })
})

test("add two domain cookies", () => {
	const jar = new CookieJar()

	const counts = jar.overwrite({
		host1: {
			"/": {
				name11: { value: "value11", expires: "" },
				name12: { value: "value12", expires: "" },
			},
		},
		host2: {
			"/": {
				name21: { value: "value21", expires: "" },
				name22: { value: "value22", expires: "" },
			},
		},
	})

	expect(jar.size).toBe(4)
	expect(counts).toStrictEqual({ added: 4, modified: 0, removed: 0, any: true })
})
