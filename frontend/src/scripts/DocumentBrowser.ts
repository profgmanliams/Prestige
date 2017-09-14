import m from "mithril"
import { currentProviders, Provider, Source } from "_/Persistence"

export default { view }

function view(): m.Children {
	const providers: Provider<Source>[] = currentProviders()

