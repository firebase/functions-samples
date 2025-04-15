/**
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const functions = require("firebase-functions/v1");
const { google } = require("googleapis");

const youtube = google.youtube({
  version: "v3",
  auth: functions.config().youtube.key,
});

const FIREBASE_YOUTUBE_CHANNEL_ID = "UCP4bf6IHJJQehibu6ai__cg";

exports.getChannelInfo = functions.https.onRequest(
  async (request, response) => {
    const channelId = request.query.channelId || FIREBASE_YOUTUBE_CHANNEL_ID;

    // Fetch channel information
    // https://developers.google.com/youtube/v3/docs/channels/list
    const { data: channelData } = await youtube.channels.list({
      part: "snippet,statistics",
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
      part: "id, snippet",
      order: "date",
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
      "Content-Length": channelJSON.length,
      "Content-Type": "application/json",
    });
    response.write(channelJSON);
    response.end();
  },
);
