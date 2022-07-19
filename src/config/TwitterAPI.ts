import axios from 'axios'

export default axios.create({
	baseURL: process.env.TWITTER_API_URL
})
