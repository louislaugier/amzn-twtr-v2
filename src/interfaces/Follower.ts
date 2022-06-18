interface Follower {
	id: string,
	name: string,
	username: string
}

interface MetaData {
	result_count: number,
	next_token: string
}

export default interface FollowerResponse {
	data: Follower[],
	meta: MetaData
}