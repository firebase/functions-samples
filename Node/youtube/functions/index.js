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

const {onCall, HttpsError} = require("firebase-functions/v2/https");
const {defineString, defineSecret} = require("firebase-functions/params");

const {google} = require("googleapis");

const youtubeKey = defineSecret("YOUTUBE_API_KEY");
const defaultChannelId = defineString("DEFAULT_CHANNEL_ID", {
  default: "UCP4bf6IHJJQehibu6ai__cg",
});

exports.getChannelInfo = onCall(
    {secrets: [youtubeKey]},

    async (request, response) => {
      const youtube = google.youtube({
        version: "v3",
        auth: youtubeKey.value(),
      });
      const channelId = request.data.channelId || defaultChannelId;

      const channelInfo = {id: channelId};

      // Fetch channel information
      let channelData;
      try {
      // tell the client app we're starting
        response.sendChunk({status: "fetching channel info", channelInfo});

        // https://developers.google.com/youtube/v3/docs/channels/list
        const {data} = await youtube.channels.list({
          part: "snippet,statistics",
          id: channelId,
          maxResults: 1,
        });
        channelData = data;
      } catch (error) {
        throw new HttpsError("internal", "Failed to fetch channel data.");
      }

      if (!channelData.items || channelData.items.length !== 1) {
        throw new HttpsError(
            "invalid-argument",
            `Channel with ID ${channelId} not found.`,
        );
      }

      const channel = channelData.items[0];
      (channelInfo.channelTitle = channel.snippet.title),
      (channelInfo.channelDescription = channel.snippet.description),
      (channelInfo.subscriberCount = channel.statistics.subscriberCount),
      // send latest data to the client app
      response.sendChunk({status: "found channel info", channelInfo});

      // Fetch the channel's latest videos
      let videoData;
      try {
      // tell the client app we're starting to fetch videos
        response.sendChunk({status: "fetching latest videos", channelInfo});
        // https://developers.google.com/youtube/v3/docs/search/list
        const {data} = await youtube.search.list({
          part: "id, snippet",
          order: "date",
          channelId,
          maxResults: 3,
        });
        videoData = data;
      } catch (error) {
        throw new HttpsError("internal", "Failed to fetch video data.");
      }
      const videos = (videoData.items || []).map((video) => ({
        videoTitle: video.snippet.title,
        videoUrl: `https://www.youtube.com/watch?v=${video.id.videoId}`,
        videoDescription: video.snippet.description,
      }));

      channelInfo.recentVideos = videos;
      // send the latest data to the client app
      response.sendChunk({
        status: `found ${videos.length} videos`,
        channelInfo,
      });

      return channelInfo;
    },
);
