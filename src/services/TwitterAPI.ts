import TwitterAPI from "../config/TwitterAPI"

import Tweet, { TwitterResponse } from "../interfaces/Twitter"
import Account from "../interfaces/Account"

import { sleep } from "../utils/threads"
import { signOAuth } from "../utils/OAuth1"

export const sendTweet = async (tweet: Tweet): Promise<Tweet> => {
	try {
		signOAuth('POST', `${TwitterAPI.defaults.baseURL}/tweets`)
		const res: TwitterResponse = (await TwitterAPI.post('tweets', tweet)).data
		let sentTweet: Tweet = { text: '' }
		if ('text' in res.data && 'id' in res.data) sentTweet = res.data
		return sentTweet
	} catch (err: any) {
		console.log("🚀 ~ file: Tweet.ts ~ line 50 ~ tweetNewDeals ~ err", err)
		await sleep(0.5)
		return await sendTweet(tweet)
	}
}

export const deleteTweet = async (tweetID: string): Promise<void> => {
	try {
		signOAuth('DELETE', `${TwitterAPI.defaults.baseURL}/tweets/${tweetID}`)
		await TwitterAPI.delete(`tweets/${tweetID}`)
	} catch (err: any) {
		console.log("🚀 ~ file: Tweet.ts ~ line 50 ~ tweetNewDeals ~ err", err)
		await sleep(0.5)
		return await deleteTweet(tweetID)
	}
}

export const getTwitterAccounts = async (type: string, accountID: string, paginationToken: string | null = null): Promise<TwitterResponse> => {
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
	try {
		const accounts: Account[] = []
		let newSuffix: string = ''
		if (paginationToken) newSuffix = `&pagination_token=${paginationToken}`
		signOAuth('GET', `${TwitterAPI.defaults.baseURL}/${url}${newSuffix}`)
		const res: TwitterResponse = (await TwitterAPI.get(`${url}${newSuffix}`)).data

		return res
	} catch (err: any) {
		console.log("🚀 ~ file: Twitter.ts ~ line 49 ~ fetchAccounts ~ err", err)
		await sleep(0.5)
		return await getTwitterAccounts(type, accountID, paginationToken)
	}
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
        console.log("🚀 ~ file: Twitter.ts ~ line 68 ~ followAccount ~ err", err)
		await sleep(0.5)
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
        console.log("🚀 ~ file: Twitter.ts ~ line 81 ~ unFollowAccount ~ err", err)
		await sleep(0.5)
		await unfollowAccount(accountID)
	}
}