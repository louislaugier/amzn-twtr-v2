import signRequest from './../config/OAuth1'
import TwitterAPI from '../config/TwitterAPI'

import Tweet from '../interfaces/Tweet'
import Deal from '../interfaces/Deal'

import { sleep } from './utils'
import { getDeals } from './Deal'

export const tweetNewDeals = async (newDeals: Deal[]): Promise<void> => {
	try {
		let currentDeals: Deal[] = await getDeals()

		for (let i: number = 0; i < newDeals.length; i++) {
			const newDeal: Deal = newDeals[i]
			let isNew = true
			for (let j: number = 0; j < currentDeals.length; j++) if (newDeal.id === currentDeals[j].id) {
				isNew = false
				break
			}

			if (isNew) {
				console.log('Tweeting...')
				const tweet: Tweet = formatTweet(newDeal)
				await sendTweet(tweet)
			}
		}
		console.log('Done tweeting')
	} catch (err: any) {
        console.log("🚀 ~ file: Deal.ts ~ line 30 ~ tweetNewDeals ~ err", err)
	}
}

const formatTweet = (deal: Deal): Tweet => {
	const discount: string = deal.discount ? `${deal.discount}: ` : ''
	const oldPrice: string = deal.old_price ? `Was: $${deal.old_price}. ` : ''
	const newPrice: string = deal.new_price ? `New price: $${deal.new_price}! ` : ''
	const tweet: Tweet = {
		text: `${discount}${deal.title}. ${oldPrice}${newPrice}${deal.url}&tag=${process.env.AMAZON_AFFILIATE_TAG}`
	}

	return tweet
}

const sendTweet = async (tweet: Tweet): Promise<void> => {
	try {
		TwitterAPI.defaults.headers.common['Authorization'] = signRequest({
			url: `${TwitterAPI.defaults.baseURL}/tweets`,
			method: 'POST'
		}).Authorization

		await TwitterAPI.post('tweets', tweet)
	} catch (err: any) {
		console.log("🚀 ~ file: Tweet.ts ~ line 54 ~ tweetNewDeals ~ err", err)
		await sleep(15)
		await sendTweet(tweet)
	}
}