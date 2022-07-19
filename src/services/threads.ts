import Deal from '../interfaces/Deal'
import Account from '../interfaces/Account'
import Tweet, { TwitterResponse } from '../interfaces/Twitter'

import { getTwitterAccounts, followAccount, unfollowAccount, sendTweet, deleteTweet } from './TwitterAPI'
import { crawlDealPage, crawlDealPagesCount, crawlLatestDeals } from './crawler'

import { insertRows, getRows, updateRows, deleteRows } from '../utils/PostgreSQL'
import { sleep } from '../utils/threads'
import { formatTweet } from '../utils/Tweet'

export const initThreads = async (): Promise<void> => {
	await Promise.all([
		// syncNewDeals(),
		// syncExpiredDeals(),
		// initAutoTweet(),
		// syncSubscriptions(),

		syncAccounts()
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

	for (const deal of deals) {
		const isExistingDeal: boolean = await crawlDealPage(deal.url)
		if (!isExistingDeal) {
			console.log(`Deleting deal ${deal.id}`)
			if (deal.tweetId) await deleteTweet(deal.tweetId || '')
			await deleteRows('deal', { id: deal.id })
		}
	}

	console.log('Done syncing expired deals')
	await sleep(0.5)
	await syncExpiredDeals()
}

const initAutoTweet = async (): Promise<void> => {
	let deals: Deal[] = await getRows('deal')

	for (const deal of deals)
		if (!deal.tweetId) {
			console.log('Tweeting...')
			const tweet: Tweet = formatTweet(deal)
			const sentTweet: Tweet = await sendTweet(tweet)
			await updateRows('deal', { id: deal.id }, { tweetId: sentTweet.id })
		}
	console.log('Done tweeting')

	await initAutoTweet()
}

const syncSubscriptions = async (paginationToken: string | null = null): Promise<void> => {
	const subscriptions: TwitterResponse = await getTwitterAccounts('followers', process.env.TWITTER_ACCOUNT_ID || '', paginationToken)
	if (Array.isArray(subscriptions.data)) {
		for (const i in subscriptions.data) subscriptions.data[i].isFollowed = true
		await insertRows('account', subscriptions.data)
	}

	console.log('Done adding new subscriptions to database')
	await syncSubscriptions(subscriptions.meta?.next_token)
}

const syncAccounts = async (paginationToken: string | null = null): Promise<void> => {
	const followAccountUsers: string[] = process.env.TWITTER_FOLLOW_ACCOUNTS?.split(',') || []
	const accounts: TwitterResponse = { data: [] }

	if (Array.isArray(accounts.data)) {
		for (const account of followAccountUsers) {
			console.log(`Getting ${account}'s followers`)
			const followers: TwitterResponse = await getTwitterAccounts('followers', account, paginationToken)
			if (Array.isArray(followers.data)) {
				for (const i in followers.data) followers.data[i] = { id: followers.data[i].id }
				await insertRows('account', followers.data)
			}
		}
	}

	console.log('Done adding new followers to database')
	await syncAccounts(accounts.meta?.next_token)
}

const initAutoFollow = async (): Promise<void> => {
	const accounts: Account[] = await getRows('account')

	for (const account of accounts)
		if (!account.isFollowed) {
			console.log(`Following account ${account.id}...`)
			await followAccount(account.id)
			await updateRows('account', { id: account.id }, { isFollowed: true })
			await sleep(4)
		}

	await initAutoFollow()
}

const initAutoUnfollow = async (): Promise<void> => {
	const followedAccounts: Account[] = await getRows('account', { isFollowed: true })
	for (const account of followedAccounts) {
		console.log(`Unfollowing account ${account.id}...`)
		await unfollowAccount(account.id)
		await updateRows('account', { id: account.id }, { isFollowed: false })
		await sleep(10)
	}

	await initAutoUnfollow()
}
