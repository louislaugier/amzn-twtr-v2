export default interface Deal {
	id: string,
	title: string,
	url: string,
	oldPrice: number | null,
	newPrice: number | null,
	discount: string | null,
	imageUrl: string
}