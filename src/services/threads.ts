import Deal from '../interfaces/Deal'
import Account from '../interfaces/Account'

import { tweetNewDeals, getTwitterAccounts, followAccount, unfollowAccount} from './Twitter'
import { saveRows, sleep } from './utils'
import { crawlDealPagesCount, crawlLatestDeals } from './crawler'

export const initThreads = async (): Promise<void> => {
	await Promise.all([syncNewDeals('ASC'), syncNewDeals('DESC'), syncExpiredDeals(), syncAccounts(), initAutoFollow(), initAutoUnfollow() ])
}

const syncNewDeals = async (ascOrDesc: string): Promise<void> => {
	const pagesCount: number = await crawlDealPagesCount()

	const syncPage = async (page: number): Promise<number> => {
		const deals: Deal[] = await crawlLatestDeals(page)
		await tweetNewDeals(deals)
		const resp: any = await saveRows('deal', deals, true)
		return resp.rowsAffected
	}

	if (ascOrDesc === 'ASC') {
		for (let page: number = 0; page < pagesCount; page++) {
			const rowsAffected: number = await syncPage(page)
			if (!rowsAffected) break
		}
	} else if (ascOrDesc === 'DESC') {
		for (let page: number = pagesCount; page > 0; page--) {
			const rowsAffected: number = await syncPage(page)
			if (!rowsAffected) break
		}
	}

	await syncNewDeals(ascOrDesc)
}

const syncExpiredDeals = async (): Promise<void> => {
	
}

const syncAccounts = async (): Promise<void> => {
	const accounts: Account[] = await getTwitterAccounts('subscriptions', process.env.TWITTER_ACCOUNT_ID || '')

	const followAccountUsers: string[] = process.env.TWITTER_FOLLOW_ACCOUNTS?.split(',') || []
	for (let i: number = 0; i < followAccountUsers?.length; i++) {
		const followers: Account[] = await getTwitterAccounts('followers', followAccountUsers[i])
		accounts.push(...followers)
	}
	await saveRows('account', accounts)

	await sleep(15)
	await syncAccounts()
}

export const initAutoFollow = async (): Promise<void> => {
	try {
		const subscriptions: Account[] = await getTwitterAccounts('subscriptions', process.env.TWITTER_ACCOUNT_ID || '')

		const followAccountUsers: string[] = process.env.TWITTER_FOLLOW_ACCOUNTS?.split(',') || []
		for (let i: number = 0; i < followAccountUsers?.length; i++) {
			console.log(`Following followers of account ${followAccountUsers[i]}...`)
			const followers: Account[] = await getTwitterAccounts('followers', followAccountUsers[i])
			let isNew: boolean = true
			for (let j: number = 0; j < followers.length; j++) {
				for (let k: number = 0; k < subscriptions.length; k++) if (followers[j].id === subscriptions[k].id)  {
					isNew = false
					break
				}
				if (isNew) await followAccount(followers[i].id)
			}
			console.log(`Done following followers of account ${followAccountUsers[i]}`)
		}
		await initAutoFollow()
	} catch (err: any) {
        console.log("🚀 ~ file: Twitter.ts ~ line 22 ~ initAutoFollow ~ err", err)
	}
}

const initAutoUnfollow = async (): Promise<void> => {
	try {
		const subscriptions: Account[] = await getTwitterAccounts('subscriptions', process.env.TWITTER_ACCOUNT_ID || '')
		for (let i: number = 0; i < subscriptions.length; i++) {
			await unfollowAccount(subscriptions[i].id)
		}

		await sleep(0.5)
		await initAutoUnfollow()
	} catch (err: any) {
        console.log("🚀 ~ file: Twitter.ts ~ line 22 ~ initAutoFollow ~ err", err)
	}
}