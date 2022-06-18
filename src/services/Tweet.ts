import { RequestOptions } from 'oauth-1.0a'

import db from '../config/PostgreSQL'
import getHeader from './../config/OAuth1'
import TwitterAPI from '../config/TwitterAPI'

import Tweet from '../interfaces/Tweet'
import Deal from '../interfaces/Deal'

export const tweetNewDeals = async (lastDeals: Deal[]): Promise<void> => {
	try {
		const deals: Deal[] = db.select().table('deal')
		for (let i: number = 0; i < lastDeals.length; i++) {
			const newDeal: Deal = lastDeals[i]
			let isNew = true
			for (let j: number = 0; j < deals.length; j++) if (newDeal === deals[i]) isNew = false
			if (isNew) {
				const discount: string = newDeal.discount ? `${newDeal.discount}: ` : ''
				const oldPrice: string = newDeal.oldPrice ? `Was: ${newDeal.oldPrice}. ` : ''
				const newPrice: string = newDeal.newPrice ? `Current price: ${newDeal.newPrice}! ` : ''
				const tweet: Tweet = {
					text: `${discount}${newDeal.title}. ${oldPrice}${newPrice}${newDeal.URL}`
				}

				const oauthReqOptions: RequestOptions = {
					url: `${process.env.TWITTER_API_URL}/tweets`,
					method: 'POST',
					data: tweet
				}
				TwitterAPI.defaults.headers.common['Authorization'] = getHeader(oauthReqOptions).Authorization
				await TwitterAPI.post('tweets', tweet, {
					headers: {
						'Connection': 'close',
						'Accept': '*/*',
						'User-Agent': 'OAuth gem v0.4.4',
						'Content-Type': 'application/x-www-form-urlencoded'
					}
				})

				// await axios.post(oauthReqOptions.url, tweet, {
				// 	headers: {
				// 		'Authorization': getHeader(oauthReqOptions).Authorization
				// 	}
				// })
			}
		}
	} catch (err: any) {
        console.log("🚀 ~ file: Deal.ts ~ line 34 ~ tweetNewDeals ~ err", err)
	}
}