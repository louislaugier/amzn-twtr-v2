import { Query } from 'express-serve-static-core'
import puppeteer from 'puppeteer'

import db from '../config/PostgreSQL'

import Deal from '../interfaces/Deal'

import { formatOrderBy, formatWhere, sleep } from './utils'

export const crawlLatestAmazonDeals = async (pagination: number = 1): Promise<Deal[]> => {
	const browser: puppeteer.Browser = await puppeteer.launch()
	const page: puppeteer.Page = await browser.newPage()
	const offset: string = ((pagination - 1) * 60).toString()
	await page.goto(`https://www.amazon.com/deals?deals-widget=%257B%2522version%2522%253A1%252C%2522viewIndex%2522%253A${offset}%252C%2522presetId%2522%253A%2522CC116DB72B622FCC0446D12025433120%2522%252C%2522sorting%2522%253A%2522BY_CUSTOM_CRITERION%2522%257D`)

	const dealsGridSelector: string = 'div[aria-label="Deals grid"]'
	await page.waitForSelector(dealsGridSelector)
	await page.waitForTimeout(5000)
	const htmlDealsGrid: string = (await page.$eval(dealsGridSelector, elem => elem.innerHTML)).toString().replace(/&amp;/g, "").replace(/&quot;/g, "")
	const htmlDeals: string[] = htmlDealsGrid.split('<div class="DealGridItem-module__dealItem_')

	const deals: Deal[] = []
    for (let i: number = 1; i < htmlDeals.length; i++) {
		const deal: string = htmlDeals[i]
		let discount: string | null = deal.split('<div class="BadgeAutomatedLabel-module__badgeAutomatedLabel_')[1].split('">')[1].split('</')[0]
		if (discount === 'Deal') discount = null
		deals.push({
			id: deal.split('data-deal-id="')[1].split('"')[0],
			title: deal.split('<div class="DealContent-module__truncate_')[1].split('">')[1].split('</div>')[0],
			url: `${deal.split('<a class="a-link-normal" href="')[1].split('"')[0]}&tag=${process.env.AMAZON_AFFILIATE_TAG}`,
			old_price: deal.includes('<div class="a-row a-spacing-micro"><span class="a-size-small a-color-secondary">') ? parseFloat(deal.split('<div class="a-row a-spacing-micro"><span class="a-size-small a-color-secondary">')[1].split('class="a-price-whole">')[1].split('</')[0]) : null,
			new_price: deal.includes('<span class="a-size-mini"><span role="text" class="a-price"') ? parseFloat(deal.split('<span class="a-size-mini"><span role="text" class="a-price"')[1].split('class="a-price-whole">')[1].split('</')[0]) : null,
			discount,
			image_url: deal.split('<img alt="')[1].split('src="')[1].split('"')[0]
		})
	}

	await browser.close()
	console.log('Done crawling')
	return deals
}

export const getDeals = async (query: Query = {}): Promise<Deal[]> => {
	try {
		let deals: Deal[] = []
		await db.select().table('deal').where(...formatWhere(query)).orderBy(...formatOrderBy(query)).limit(query.limit ?? 10000).offset(query.offset ?? 0).then((res: Deal[]) => deals = res)
		return deals
	} catch (err: any) {
        console.log("🚀 ~ file: Deal.ts ~ line 48 ~ getDeals ~ err", err)
		await sleep(0.5)
		return await getDeals(query)
	}
}

export const updateDeals = async (deals: Deal[]): Promise<void> => {
	try {
		await db('deal').insert(deals).onConflict('id').ignore().then((res: any) => {})
		console.log('Done saving new deals')
	} catch (err: any) {
        console.log("🚀 ~ file: Deal.ts ~ line 59 ~ updateDeals ~ err", err)
		await sleep(0.5)
		await updateDeals(deals)
	}
}