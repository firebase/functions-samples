const functions = require('firebase-functions')
const { google } = require('googleapis')

const youtube = google.youtube({
	version: 'v3',
	auth: functions.config().youtube.key,
})

exports.latestVideoOnYtChannel = functions.https.onRequest(async (req, res) => {
	if (req.method !== 'GET') {
		return res.status(400).send('Please send a GET request')
	}

	// Get channelId from query string
	const { channelId } = req.query

	// Generate query to Youtube API
	// Get a list, ordered by date and limited to one item
	// Frankly, it's an array with 1 latest video
	const { data } = await youtube.search.list({
		part: 'id',
		order: 'date',
		channelId,
		maxResults: 1,
	})

	// Get ID object from items[0]
	const { id } = data.items[0]

	// Get Video ID from Id object
	// Redirect to link with this video ID
	return res.redirect(`https://www.youtube.com/watch?v=${id.videoId}`)
})
