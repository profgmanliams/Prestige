import m from "mithril"

declare const process: {
	env: {
		NODE_ENV?: string
		PRESTIGE_ALLOWED_HOSTS: string
		PRESTIGE_FRONTEND_ROLLBAR_TOKEN?: string
		PRESTIGE_EXT_URL_PREFIX?: string
	}
}

const NODE_ENV = process.env.NODE_ENV || "production"

const PRESTIGE_BACKEND = "/"

