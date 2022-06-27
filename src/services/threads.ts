import Deal from '../interfaces/Deal'
import Account from '../interfaces/Account'
import Tweet from '../interfaces/Twitter'

import { getTwitterAccounts, followAccount, unfollowAccount, sendTweet} from './TwitterAPI'
import { crawlDealPagesCount, crawlLatestDeals } from './crawler'

import { insertRows, getRows, updateRows } from '../utils/PostgreSQL'
import { sleep } from '../utils/threads'
import { formatTweet } from '../utils/Tweet'
import { Browser, launch, Page } from 'puppeteer'

export const initThreads = async (): Promise<void> => {
	await Promise.all([
		// syncNewDeals(),
		syncAccounts(),
		// syncExpiredDeals(),
		// tweetNewDeals(),
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
	const browser: Browser = await launch()
	const page: Page = await browser.newPage()
	await page.goto('')
	const selector: string = ''
	await page.waitForSelector(selector)
	await page.$eval(selector, (elem: any) => console.log(elem.innerHTML))

	await browser.close()
}

const syncAccounts = async (offset: number = 0): Promise<void> => {
	const accounts: Account[] = await getTwitterAccounts('subscriptions', process.env.TWITTER_ACCOUNT_ID || '')

	const followAccountUsers: string[] = process.env.TWITTER_FOLLOW_ACCOUNTS?.split(',') || []
	for (let i: number = 0; i < followAccountUsers?.length; i++) {
		console.log(`Getting ${followAccountUsers[i]}'s followers with offset ${offset}`)
		// object with accounts and next token and pass as param
		const followers: Account[] = await getTwitterAccounts('followers', followAccountUsers[i], offset)
		accounts.push(...followers)
	}
	await insertRows('account', accounts)
	console.log(`Done adding new followers to database...`)

	await sleep(15)
	await syncAccounts(offset + 1000)
}

const tweetNewDeals = async (): Promise<void> => {
	try {
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
		await sleep(0.5)
		await tweetNewDeals()
	} catch (err: any) {
        console.log("🚀 ~ file: Deal.ts ~ line 30 ~ tweetNewDeals ~ err", err)
	}
}

const initAutoFollow = async (): Promise<void> => {
	try {
		const accounts: Account[] = await getRows('account')

		for (let i: number = 0; i < accounts.length; i++) {
			if (!accounts[i].isFollowed) {
				console.log(`Following account ${accounts[i]}...`)
				await followAccount(accounts[i].id)
				await updateRows('account', { id: accounts[i].id }, { isFollowed: true })
			}
		}
		await initAutoFollow()
	} catch (err: any) {
        console.log("🚀 ~ file: Twitter.ts ~ line 22 ~ initAutoFollow ~ err", err)
	}
}

const initAutoUnfollow = async (): Promise<void> => {
	try {
		const subscriptions: Account[] = await getTwitterAccounts('subscriptions', process.env.TWITTER_ACCOUNT_ID || '')
		console.log(`Unfollowing follower ${subscriptions[0].id}...`)
		await unfollowAccount(subscriptions[0].id)

		await sleep(0.5)
		await initAutoUnfollow()
	} catch (err: any) {
        console.log("🚀 ~ file: Twitter.ts ~ line 22 ~ initAutoFollow ~ err", err)
	}
}