import Account from "./Account"

export default interface Tweet {
	id?: string,
	text: string
}

interface MetaData {
	result_count: number,
	previous_token?: string,
	next_token?: string
}

export interface TwitterResponse {
	data: Account[] | Account | Tweet,
	meta?: MetaData
}
