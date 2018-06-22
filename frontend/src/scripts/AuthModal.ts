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
}

class AuthFormView implements m.ClassComponent<never> {
	currentView: "login" | "signup" | "forgot-request"
	isSignupLoading: boolean
	signupError: m.Children

	constructor() {
		this.currentView = "login"
		this.isSignupLoading = false
		this.signupError = null
	}

	view(): m.Children {
		const onLoginSubmit = (event: Event) => {
			event.preventDefault()
			AuthService
				.login((event.target as LoginForm).loginEmail.value, (event.target as LoginForm).loginPassword.value)
				.then(ModalManager.close)
				.catch((error) => {
					console.error("Error logging in", error)
					alert("Error logging in: [" + error.code + "] " + error.message)
				})
		}

		const onSignupSubmit = (event: Event) => {
			event.preventDefault()
			this.signupError = null
			this.isSignupLoading = true

			const password = (event.target as LoginForm).signupPassword.value

			if (password !== (event.target as LoginForm).signupPasswordRepeat.value) {
				alert("The passwords don't match. Please repeat the same password and then click Sign Up.")
				return
			}

			AuthService.signup((event.target as LoginForm).signupEmail.value, password)
				.then(user => {
					console.log("User signed up", user)
					ModalManager.close()
				})
				.catch(error => {
					console.dir(error)
					console.error("Error signing up")
					const code = error?.response?.error?.code

					if (code === "email-duplicate") {
						this.signupError = [
							"There's an account with that email already. Please ",
							m(
								"a",
								{
