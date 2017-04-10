export default function humanSizeDisplay(size: number): string {
	if (size < 1024) {
		return `${size} bytes`
	}

	const sizeLabels = ["bytes", "KiB", "MiB", "GiB", "TiB"]
	let labelIndex = 0
	let fileSize = ""
