import Deal from "../interfaces/Deal"
import Tweet from "../interfaces/Twitter"

export const formatTweet = (deal: Deal): Tweet => {
	const discount: string = deal.discount ? `${deal.discount}: ` : ''
	const oldPrice: string = deal.oldPrice ? `Was: $${deal.oldPrice}. ` : ''
	const newPrice: string = deal.newPrice ? `New price: $${deal.newPrice}! ` : ''
	const tweet: Tweet = {
		text: `${discount}${deal.title}. ${oldPrice}${newPrice}${deal.url}&tag=${process.env.AMAZON_AFFILIATE_TAG}`
	}

	return tweet
}