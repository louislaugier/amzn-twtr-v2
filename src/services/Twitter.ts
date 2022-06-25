import TwitterAPI from "../config/TwitterAPI"
import signOAuth from '../config/OAuth1'

import Tweet, { UserResponse } from "../interfaces/Twitter"
import Deal from '../interfaces/Deal'

import { getRows, sleep } from "./utils"
import Account from "../interfaces/Account"

export const tweetNewDeals = async (newDeals: Deal[]): Promise<void> => {
	try {
		let deals: Deal[] = await getRows('deal')

		for (let i: number = 0; i < newDeals.length; i++) {
			const newDeal: Deal = newDeals[i]
			let isNew: boolean = true
			for (let j: number = 0; j < deals.length; j++) if (newDeal.id === deals[j].id) {
				isNew = false
				break
			}

			if (isNew) {
				console.log('Tweeting...')
				const tweet: Tweet = formatTweet(newDeal)
				await sendTweet(tweet)
			}
		}
		console.log('Done tweeting')

	} catch (err: any) {
        console.log("🚀 ~ file: Deal.ts ~ line 30 ~ tweetNewDeals ~ err", err)
	}
}

const formatTweet = (deal: Deal): Tweet => {
	const discount: string = deal.discount ? `${deal.discount}: ` : ''
	const oldPrice: string = deal.oldPrice ? `Was: $${deal.oldPrice}. ` : ''
	const newPrice: string = deal.newPrice ? `New price: $${deal.newPrice}! ` : ''
	const tweet: Tweet = {
		text: `${discount}${deal.title}. ${oldPrice}${newPrice}${deal.url}&tag=${process.env.AMAZON_AFFILIATE_TAG}`
	}

	return tweet
}

const sendTweet = async (tweet: Tweet): Promise<void> => {
	try {
		signOAuth('POST', `${TwitterAPI.defaults.baseURL}/tweets`)
		await TwitterAPI.post('tweets', tweet)
	} catch (err: any) {
		console.log("🚀 ~ file: Tweet.ts ~ line 50 ~ tweetNewDeals ~ err", err)
		await sleep(0.5)
		await sendTweet(tweet)
	}
}

export const getTwitterAccounts = async (type: string, accountID: string): Promise<Account[]> => {
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
	signOAuth('GET', `${TwitterAPI.defaults.baseURL}/${url}`)

	const fetchAccounts = async (paginationToken: string | null = null): Promise<Account[]> => {
		try {
			const accounts: Account[] = []
			let newSuffix: string = ''
			if (paginationToken) newSuffix = `&pagination_token=${paginationToken}`
			const res: UserResponse = await TwitterAPI.get(`${url}${paginationToken}`)

			accounts.push(...res.data)
			if (res.meta.next_token) {
				accounts.push(...await fetchAccounts(res.meta.next_token))
				return accounts
			}
			else return accounts
		} catch (err: any) {
			console.log("🚀 ~ file: Twitter.ts ~ line 57 ~ getTwitterAccounts ~ err", err)
			await sleep(15)
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
		await followAccount(accountID)
	}
}