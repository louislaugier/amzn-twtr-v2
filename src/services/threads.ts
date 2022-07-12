import Deal from '../interfaces/Deal'
import Account from '../interfaces/Account'
import Tweet, { TwitterResponse } from '../interfaces/Twitter'

import { getTwitterAccounts, followAccount, unfollowAccount, sendTweet, deleteTweet} from './TwitterAPI'
import { crawlDealPage, crawlDealPagesCount, crawlLatestDeals } from './crawler'

import { insertRows, getRows, updateRows, deleteRows } from '../utils/PostgreSQL'
import { sleep } from '../utils/threads'
import { formatTweet } from '../utils/Tweet'

import { Browser, launch, Page } from 'puppeteer'

export const initThreads = async (): Promise<void> => {
	await Promise.all([
		// syncNewDeals(),
		syncExpiredDeals(),
		// initAutoTweet(),
		// syncSubscriptions(),

		// syncAccounts(),
		// initAutoFollow(),
		// initAutoUnfollow()
	])
}

const syncNewDeals = async (): Promise<void> => {
	const pagesCount: number = await crawlDealPagesCount()

	for (let page: number = 1; page < pagesCount; page++) {
		console.log(`Crawling Amazon deals on page ${page.toString()}`)

		const crawlPages = async (): Promise<Deal[]> => {
			try {
				return await crawlLatestDeals(page)
			} catch (err: any) {
				return await crawlPages()
			}
		}
		const deals: Deal[] = await crawlPages()
		await insertRows('deal', deals)
	}

	await syncNewDeals()
}

const syncExpiredDeals = async (): Promise<void> => {
	const deals: Deal[] = await getRows('deal')

	for (let i: number = 0; i < deals.length; i++) {
		const isExistingDeal: boolean = await crawlDealPage(deals[i].url)
		if (!isExistingDeal) {
			if (deals[i].tweetId) await deleteTweet(deals[i].tweetId || '')
			await deleteRows('deal', {id: deals[i].id})
		}
	}

	console.log('Done syncing expired deals')
	await sleep(0.5)
	await syncExpiredDeals()
}

const initAutoTweet = async (): Promise<void> => {
	let deals: Deal[] = await getRows('deal')

	for (let i: number = 0; i < deals.length; i++) {
		const newDeal: Deal = deals[i]

		if (!newDeal.tweetId) {
			console.log('Tweeting...')
			const tweet: Tweet = formatTweet(newDeal)
			const sentTweet: Tweet = await sendTweet(tweet)
			await updateRows('deal', { id: newDeal.id }, { tweetId: sentTweet.id })
		}
	}
	console.log('Done tweeting')

	await initAutoTweet()
}

const syncSubscriptions = async (paginationToken: string | null = null): Promise<void> => {
	const subscriptions: TwitterResponse = await getTwitterAccounts('followers', process.env.TWITTER_ACCOUNT_ID || '', paginationToken)
    console.log("🚀 ~ file: threads.ts ~ line 78 ~ syncSubscriptions ~ subscriptions", subscriptions)
	if (Array.isArray(subscriptions.data)) {
		subscriptions.data.push(...subscriptions.data)
		await insertRows('account', subscriptions.data)
	}

	console.log('Done adding new subscriptions to database')
	await sleep(15)
	await syncSubscriptions(subscriptions.meta?.next_token)
}

const syncAccounts = async (paginationToken: string | null = null): Promise<void> => {
	const followAccountUsers: string[] = process.env.TWITTER_FOLLOW_ACCOUNTS?.split(',') || []
	const accounts: TwitterResponse = { data: []}

	if (Array.isArray(accounts.data)) {
		for (let i: number = 0; i < followAccountUsers?.length; i++) {
			console.log(`Getting ${followAccountUsers[i]}'s followers`)
			const followers: TwitterResponse = await getTwitterAccounts('followers', followAccountUsers[i], paginationToken)
			if (Array.isArray(followers.data)) accounts.data.push(...followers.data)
		}
		await insertRows('account', accounts.data)
	}

	console.log('Done adding new followers to database')
	await syncAccounts(accounts.meta?.next_token)
}

const initAutoFollow = async (): Promise<void> => {
	const accounts: Account[] = await getRows('account')

	for (let i: number = 0; i < accounts.length; i++) if (!accounts[i].isFollowed) {
		console.log(`Following account ${accounts[i]}...`)
		await followAccount(accounts[i].id)
		await updateRows('account', { id: accounts[i].id }, { isFollowed: true })
	}

	await initAutoFollow()
}

const initAutoUnfollow = async (next_token: string | null = null): Promise<void> => {
	const subscriptions: TwitterResponse = await getTwitterAccounts('subscriptions', process.env.TWITTER_ACCOUNT_ID || '', next_token)
	if (Array.isArray(subscriptions.data)) for (let i = 0; i < subscriptions.data.length; i++) {
		console.log(`Unfollowing follower ${subscriptions.data[i].id}...`)
		await unfollowAccount(subscriptions.data[i].id)
	}

	await initAutoUnfollow(subscriptions.meta?.next_token)
}