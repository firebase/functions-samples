const functions = require('firebase-functions');
const { google } = require('googleapis');

const youtube = google.youtube({
  version: 'v3',
  auth: functions.config().youtube.key,
});

const FIREBASE_YOUTUBE_CHANNEL_ID = 'UCP4bf6IHJJQehibu6ai__cg';

exports.getChannelInfo = functions.https.onRequest(
  async (request, response) => {
    const channelId = request.query.channelId || FIREBASE_YOUTUBE_CHANNEL_ID;

    // Fetch channel information
    // https://developers.google.com/youtube/v3/docs/channels/list
    const { data: channelData } = await youtube.channels.list({
      part: 'snippet,statistics',
      id: channelId,
      maxResults: 1,
    });

    if (!channelData.items || channelData.items.length !== 1) {
      response.send(`Channel with ID ${channelId} not found.`);
      return;
    }

    const channel = channelData.items[0];

    // Fetch the channel's latest videos
    // https://developers.google.com/youtube/v3/docs/search/list
    const { data: videoData } = await youtube.search.list({
      part: 'id, snippet',
      order: 'date',
      channelId,
      maxResults: 3,
    });

    const videos = videoData.items || [];

    const channelDetails = {
      id: channelId,
      channelTitle: channel.snippet.title,
      channelDescription: channel.snippet.description,
      subscriberCount: channel.statistics.subscriberCount,
      recentVideos: videos.map((video) => {
        return {
          videoTitle: video.snippet.title,
          videoUrl: `https://www.youtube.com/watch?v=${video.id.videoId}`,
          videoDescription: video.snippet.description,
        };
      }),
    };

    // Respond with channel details as JSON
    const channelJSON = JSON.stringify(channelDetails, null, 2);
    response.writeHead(200, {
      'Content-Length': channelJSON.length,
      'Content-Type': 'application/json',
    });
    response.write(channelJSON);
    response.end();
  }
);
