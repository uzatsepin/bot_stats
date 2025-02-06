import { Api } from 'telegram';

export async function getChannel(client, username) {
  const channel = await client.getEntity(username);
  if (!channel) {
    throw new Error('Channel not found');
  }
  return channel;
}

export async function getChannelFullInfo(client, channel) {
  return await client.invoke(new Api.channels.GetFullChannel({ channel }));
}

export async function getChannelMessages(client, channel, options = { limit: 100 }) {
  return await client.getMessages(channel, options);
}

export function calculateEngagementMetrics(messages, participantsCount) {
  let totalViews = 0;
  let maxViews = 0;
  
  messages.forEach(msg => {
    if (msg.views) {
      totalViews += msg.views;
      maxViews = Math.max(maxViews, msg.views);
    }
  });

  const avgViews = messages.length ? Math.floor(totalViews / messages.length) : 0;
  const engagementRate = participantsCount ? (avgViews / participantsCount * 100).toFixed(2) : 0;
  const maxEngagementRate = participantsCount ? (maxViews / participantsCount * 100).toFixed(2) : 0;

  return {
    total_views: totalViews,
    average_views: avgViews,
    max_views: maxViews,
    engagement_rate: Number(engagementRate),
    max_engagement_rate: Number(maxEngagementRate)
  };
}

export function formatPostData(post) {
  return {
    id: post.id,
    text: post.message || null,
    date: post.date,
    views: post.views || 0,
    forwards: post.forwards || 0,
    replies: post.replies ? post.replies.count : 0,
    media: post.media || null,
    reactions: post.reactions?.results?.reduce((total, reaction) => total + reaction.count, 0) || 0
  };
}
