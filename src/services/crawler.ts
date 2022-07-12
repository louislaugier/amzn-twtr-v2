import { Browser, launch, Page } from "puppeteer"

import Deal from "../interfaces/Deal"

import { parseDeals } from "../utils/Deal"

export const crawlDealPagesCount = async (): Promise<number> => {
	const browser: Browser = await launch()
	const page: Page = await browser.newPage()
	await page.goto('https://www.amazon.com/deals?deals-widget=%257B%2522version%2522%253A1%252C%2522viewIndex%2522%253A0%252C%2522presetId%2522%253A%2522CC116DB72B622FCC0446D12025433120%2522%252C%2522sorting%2522%253A%2522BY_CUSTOM_CRITERION%2522%257D')
	const pagesCountSelector: string = 'ul>li.a-disabled:nth-child(6)'
	await page.waitForSelector(pagesCountSelector)
	const pagesCount: number = parseInt((await page.$eval(pagesCountSelector, (elem: any) => elem.innerHTML)).toString())

	await browser.close()
	console.log('Done crawling pages count')
	return pagesCount
}

export const crawlLatestDeals = async (pagination: number = 1): Promise<Deal[]> => {
	const browser: Browser = await launch()
	const page: Page = await browser.newPage()
	const offset: string = ((pagination - 1) * 60).toString()
	await page.goto(`https://www.amazon.com/primeday?deals-widget=%257B%2522version%2522%253A1%252C%2522viewIndex%2522%253A${offset}%252C%2522presetId%2522%253A%2522deals-collection-all-deals%2522%252C%2522sorting%2522%253A%2522BY_SCORE%2522%257D`)
	// await page.goto(`https://www.amazon.com/deals?deals-widget=%257B%2522version%2522%253A1%252C%2522viewIndex%2522%253A${offset}%252C%2522presetId%2522%253A%2522EED1C4848038319A2FFB08EF3D43D34D%2522%252C%2522sorting%2522%253A%2522BY_CUSTOM_CRITERION%2522%257D`)
	const dealsGridSelector: string = 'div[aria-label="Deals grid"]'
	await page.waitForSelector(dealsGridSelector)
	await page.waitForTimeout(5000)

	const deals: Deal[] = await parseDeals(page, dealsGridSelector)

	await browser.close()
	console.log(`Done crawling deals on page ${pagination}`)
	return deals
}

export const crawlDealPage = async (url: string): Promise<boolean> => {
	const browser: Browser = await launch()
	const page: Page = await browser.newPage()
	await page.goto(url)
	await page.waitForNavigation({waitUntil: 'networkidle2'})
	const html: string = (await page.$eval('html', (elem: any) => elem.innerHTML)).toString()
	await browser.close()

	if (html.includes('unavailable')) return false
	return true
}