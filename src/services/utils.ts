import { Query } from 'express-serve-static-core'

import { crawlLatestAmazonDeals, updateDeals } from './../services/Deal'
import { tweetNewDeals } from './../services/Tweet'

import Deal from './../interfaces/Deal'

export const initCrawler = async (): Promise<void> => {
	for (let page = 1; page < 200; page++) {
		console.log(`Crawling current deals on Amazon page ${page}`)
		try {
			const deals: Deal[] = await crawlLatestAmazonDeals(page)
			await tweetNewDeals(deals)
			await updateDeals(deals)
		} catch (err: any) {
			console.log("🚀 ~ file: App.ts ~ line 16 ~ initCrawler ~ err", err)
		}
	}

	setTimeout(initCrawler, 15 * 60000)
}

export const sleep = async (minutes: number): Promise<unknown> => {
	console.log(`Idling for ${minutes} minutes...`)
	return new Promise(resolve => setTimeout(resolve, minutes * 60000))
}

export const formatWhere = (query: Query): Array<object> | Array<number> => {
	let where: any = {}
	for (let i: number = 0; i < Object.keys(query).length; i++) {
		const param: string = Object.keys(query)[i]
		if (param !== 'limit' && param !== 'offset' && param !== 'orderby' && param !== 'order') where[param] = query[param]
	}

	if (!Object.keys(where).length) return [1, 1]
	return [where]
}

export const formatOrderBy = (query: Query): Array<string> => {
	const defaultParams: Array<string> = ['id', 'asc']
	if (query.orderby) {
		const orderby: Array<string> = []
		orderby.push(typeof query.orderby === 'string' ? query.orderby : defaultParams[0])
		if (query.order) orderby.push(typeof query.order === 'string' ? query.order : defaultParams[1])
		return orderby
	} else return defaultParams
}