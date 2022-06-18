import 'dotenv/config'
import { crawlLatestAmazonDeals, updateDealsTable } from './services/Deal'
import { tweetNewDeals } from './services/Tweet'

const refresh = async () => {
	const deals = await crawlLatestAmazonDeals()
	await tweetNewDeals(deals)
	await updateDealsTable(deals)
}

refresh()

