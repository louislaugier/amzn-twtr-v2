import { Page } from "puppeteer"

import Deal from "../interfaces/Deal"

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