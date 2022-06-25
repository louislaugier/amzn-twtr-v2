import { Query } from 'express-serve-static-core'
import { Page } from 'puppeteer'

import db from '../config/PostgreSQL'

import Deal from '../interfaces/Deal'

export const getRows = async (table: string, query: Query = {}): Promise<any[]> => {
	try {
		let rows: any[] = []
		await db.select().table(table).where(...formatWhere(query)).orderBy(...formatOrderBy(query)).limit(query.limit ?? 10000).offset(query.offset ?? 0).then((res: any[]) => rows = res)
		
		return rows
	} catch (err: any) {
        console.log("🚀 ~ file: utils.ts ~ line 14 ~ getRows ~ err", err)
		await sleep(0.5)
		return await getRows(table, query)
	}
}

export const saveRows = async (table: string, rows: any[], count: boolean = false): Promise<Object | void> => {
	try {
		let oldCount: number = 0
		let newCount: number = 0
		if (count) oldCount = await getRowsCount(table)

		await db('account').insert(rows).onConflict('id').ignore().then((res: any) => {})

		if (count) {
			newCount = await getRowsCount(table)
			console.log('Done saving new accounts')
			const rowsAffected: number =  newCount - oldCount
			return { rowsAffected, rows }
		}
	} catch (err: any) {
        console.log("🚀 ~ file: utils.ts ~ line 35 ~ saveRows ~ err", err)
		await sleep(0.5)
		return await saveRows(table, rows, count)
	}
}

export const getRowsCount = async (table: string): Promise<number> => {
	try {
		let count: number = 0
		await db.raw(`select count(*) from ${table}`).then((res: any) => count = res)
		return count
	} catch (err: any) {
		console.log("🚀 ~ file: utils.ts ~ line 47 ~ saveRows ~ err", err)
		await sleep(0.5)
		return await getRowsCount(table)
	}
}

const formatWhere = (query: Query): Array<object> | Array<number> => {
	let where: any = {}
	for (let i: number = 0; i < Object.keys(query).length; i++) {
		const param: string = Object.keys(query)[i]
		if (param !== 'limit' && param !== 'offset' && param !== 'orderby' && param !== 'order') where[param] = query[param]
	}

	if (!Object.keys(where).length) return [1, 1]
	return [where]
}

const formatOrderBy = (query: Query): Array<string> => {
	const defaultParams: Array<string> = ['id', 'asc']
	if (query.orderby) {
		const orderby: Array<string> = []
		orderby.push(typeof query.orderby === 'string' ? query.orderby : defaultParams[0])
		if (query.order) orderby.push(typeof query.order === 'string' ? query.order : defaultParams[1])
		return orderby
	} else return defaultParams
}

export const sleep = async (minutes: number): Promise<unknown> => {
	console.log(`Idling for ${minutes} minutes...`)
	return new Promise(resolve => setTimeout(resolve, minutes * 60000))
}

export const parseDeals = async (page: Page, dealsGridSelector: string): Promise<Deal[]> => {
	const htmlDealsGrid: string = (await page.$eval(dealsGridSelector, (elem: any) => elem.innerHTML)).toString().replace(/&amp;/g, "").replace(/&quot;/g, "")
	const htmlDeals: string[] = htmlDealsGrid.split('<div class="DealGridItem-module__dealItem_')

	const deals: Deal[] = []
    for (let i: number = 1; i < htmlDeals.length; i++) {
		const deal: string = htmlDeals[i]
		let discount: string | null = deal.split('<div class="BadgeAutomatedLabel-module__badgeAutomatedLabel_')[1].split('">')[1].split('</')[0]
		if (discount === 'Deal') discount = null

		deals.push({
			id: deal.split('data-deal-id="')[1].split('"')[0],
			title: deal.split('<div class="DealContent-module__truncate_')[1].split('">')[1].split('</div>')[0],
			url: deal.split('<a class="a-link-normal" href="')[1].split('"')[0],
			oldPrice: deal.includes('<div class="a-row a-spacing-micro"><span class="a-size-small a-color-secondary">') ? parseFloat(deal.split('<div class="a-row a-spacing-micro"><span class="a-size-small a-color-secondary">')[1].split('class="a-price-whole">')[1].split('</')[0]) : null,
			newPrice: deal.includes('<span class="a-size-mini"><span role="text" class="a-price"') ? parseFloat(deal.split('<span class="a-size-mini"><span role="text" class="a-price"')[1].split('class="a-price-whole">')[1].split('</')[0]) : null,
			discount,
			imageUrl: deal.split('<img alt="')[1].split('src="')[1].split('"')[0]
		})
	}

	return deals
}