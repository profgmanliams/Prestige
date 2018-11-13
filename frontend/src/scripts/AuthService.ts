import m from "mithril"
import Stream from "mithril/stream"
import { authUrl, getRecaptchaSiteKey } from "_/Env"
import Toaster from "_/Toaster"

export const enum AuthState {
	PENDING,
	LOGGED_IN,
	ANONYMOUS,
	OAUTH_WAITING,
}

export interface User {
	email: string
	isGitHubConnected: boolean
}

interface AuthMessage {
	type: "oauth"
	provider: "github"
	isApproved: boolean
	error?: string
}

const AUTH_URL_BASE = authUrl()

declare const grecaptcha: {
	enterprise: {
		ready(callback: ((nothing: unknown) => void)): void
		execute(siteKey: string, options: { action: string }): Promise<string>
	}
}

class AuthServiceImpl {
	authState: AuthState
	currentUser: Stream<null | User>  // Deprecated
	email: Stream<string>
	isGistAvailable: Stream<boolean>
	oAuthWindow: null | Window

	constructor() {
		this.authState = AuthState.PENDING
		// TODO: Use a non-null sentinel value for indicating anonymous user.
		this.currentUser = Stream(null)
		this.email = Stream("")
		this.isGistAvailable = Stream(false)
		this.oAuthWindow = null

		this.currentUser.map(async (user): Promise<void> => {
			this.email(user ? user.email : "anonymous")
			m.redraw()
		})
	}

	check(): void {
		m.request<{ user: null | User }>({
			method: "GET",
			url: AUTH_URL_BASE + "profile",
			withCredentials: true,
		})
			.then(response => {
				if (response.user == null) {
					this.authState = AuthState.ANONYMOUS
					this.isGistAvailable(false)
					this.currentUser(null)
