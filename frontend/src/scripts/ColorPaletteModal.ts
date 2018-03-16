import m from "mithril"
import ModalManager from "_/ModalManager"

export default { view }

function view(): m.Children {
	return m(
		ModalManager.DrawerLayout,
		{
			title: "Color Palette",
		},
		[
			m(CakeRow, { prefix: "gray" }),
			m(CakeRow, { prefix: "primary" }),
			m(CakeRow, { prefix: "blue" }),
			m(CakeRow, { prefix: "green" }),
