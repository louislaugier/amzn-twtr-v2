import TwitterAPI from "../config/TwitterAPI"

import Tweet, { TwitterResponse } from "../interfaces/Twitter"

import Account from "../interfaces/Account"
import { sleep } from "../utils/threads"
import { signOAuth } from "../utils/OAuth1"

export const sendTweet = async (tweet: Tweet): Promise<Tweet> => {
	try {
		signOAuth('POST', `${TwitterAPI.defaults.baseURL}/tweets`)
		const res: TwitterResponse = await TwitterAPI.post('tweets', tweet)
		let sentTweet: Tweet = { text: '' }
		if ('text' in res.data && 'id' in res.data) sentTweet = res.data
		return sentTweet
	} catch (err: any) {
		console.log("🚀 ~ file: Tweet.ts ~ line 50 ~ tweetNewDeals ~ err", err)
		await sleep(15)
		return await sendTweet(tweet)
	}
}

// offset
export const getTwitterAccounts = async (type: string, accountID: string, offset: number = 0): Promise<Account[]> => {
	let suffix: string = ''
	switch (type) {
		case 'subscriptions':
			suffix = 'following'
			break
		case 'followers':
			suffix = 'followers'
			break
	}
	const url: string = `users/${accountID}/${suffix}?max_results=1000`

	const fetchAccounts = async (paginationToken: string | null = null): Promise<Account[]> => {
		try {
			const accounts: Account[] = []
			let newSuffix: string = ''
			if (paginationToken) newSuffix = `&pagination_token=${paginationToken}`
			signOAuth('GET', `${TwitterAPI.defaults.baseURL}/${url}${newSuffix}`)
			const res: TwitterResponse = await TwitterAPI.get(`${url}${newSuffix}`)

			if (Array.isArray(res.data)) accounts.push(...res.data)
			if (res.meta?.next_token) accounts.push(...await fetchAccounts(res.meta?.next_token))

			return accounts
		} catch (err: any) {
			console.log("🚀 ~ file: Twitter.ts ~ line 57 ~ getTwitterAccounts ~ err", err)
			await sleep(0.5)
			return await fetchAccounts(paginationToken)
		}
	}

	return await fetchAccounts()
}

export const followAccount = async (accountID: string): Promise<void> => {
	try {
		const url: string = `users/${process.env.TWITTER_ACCOUNT_ID}/following`
		signOAuth('POST', `${TwitterAPI.defaults.baseURL}/${url}`)

		console.log(`Following account ${accountID}...`)
		await TwitterAPI.post(url, {
			target_user_id: accountID
		})
	} catch (err: any) {
        console.log("🚀 ~ file: Twitter.ts ~ line 57 ~ followAccount ~ err", err)
		await sleep(15)
		await followAccount(accountID)
	}
}

export const unfollowAccount = async (accountID: string): Promise<void> => {
	try {
		const url: string = `users/${process.env.TWITTER_ACCOUNT_ID}/following/${accountID}`
		signOAuth('DELETE', `${TwitterAPI.defaults.baseURL}/${url}`)
		console.log(`Unfollowing account ${accountID}...`)
		await TwitterAPI.delete(url)
	} catch (err: any) {
        console.log("🚀 ~ file: Twitter.ts ~ line 71 ~ unFollowAccount ~ err", err)
		await sleep(15)
		await unfollowAccount(accountID)
	}
}