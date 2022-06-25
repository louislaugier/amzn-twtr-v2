import Account from "./Account"

export default interface Tweet {
	text: string
}

interface MetaData {
	result_count: number,
	previous_token?: string,
	next_token?: string
}

export interface UserResponse {
	data: Account[],
	meta: MetaData
}