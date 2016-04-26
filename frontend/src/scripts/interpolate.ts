interface DataRecord {
	data: Record<string, unknown>
}

export default function interpolate(content: string, context: unknown): string {
	const keys: string[] = []
	const values: unknown[] = []

	if (isDataRecord(context)) {
		for (const [key, value] of Object.entries(context.data)) {
			keys.push(key)
			values.push(value)
