module.exports = {
	globDirectory: './',
	globPatterns: [
		'**/*.{jpg,js,css,png,html,json}'
	],
	swDest: 'sw.js',
	ignoreURLParametersMatching: [
		/^utm_/,
		/^fbclid$/
	]
};