import { isPromise } from "../scripts/utils"

test("promise object is okayed as a promise", async () => {
	expect(isPromise(new Promise((resolve) => resolve(void 0)))).toBeTruthy()
	expect(isPromise(Promise.resolve())).toBeTruthy()
