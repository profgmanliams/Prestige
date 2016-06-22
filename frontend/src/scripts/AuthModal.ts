import m from "mithril"
import ModalManager from "_/ModalManager"
import Button from "_/Button"
import AuthService, { AuthState, User } from "_/AuthService"
import GitHubAuthButton from "_/GitHubAuthButton"
import * as Icons from "_/Icons"

interface InputAttrs {
	id: string;
	type?: "text" | "email" | "password";
	required?: boolean;
	minlength?: number;
}

const Input = {
	view(vnode: m.VnodeDOM<InputAttrs>) {
		return m("input.pa1.br1.ba.b--silver.bg-transparent", { type: "text", ...vnode.attrs })
	},
}

export default { view, oncreate }

interface LoginForm extends HTMLFormElement {
	loginUsername: HTMLInputElement
	loginPassword: HTMLInputElement
}

function view(): m.Children {
	const authState = AuthService.getAuthState()
	const user = AuthService.currentUser()

	if (authState === AuthState.OAUTH_WAITING) {
		return m(ModalManager.DrawerLayout, { vcenter: true }, [
			m("h1.tc", m.trust("Waiting for OAuth window to close&hellip;")),
			m("p.tc", m(
				Button,
				{ style: "primary", onclick: AuthService.focusOAuthWindow.bind(AuthService) },
				"Go to that window",
			)),
		])

	} else if (authState === AuthState.LOGGED_IN && user != null) {
		return m(ModalManager.DrawerLayout, { title: "Profile" }, m(ProfileView, { user }))

	} else if (authState === AuthState.ANONYMOUS) {
		return m(ModalManager.DrawerLayout, { title: "Login / Signup" }, m(AuthFormView))

	}

}

function oncreate(vnode: m.VnodeDOM): void {
	(vnode.dom?.querySelector("input[type=email]") as HTMLInputElement)?.focus()
