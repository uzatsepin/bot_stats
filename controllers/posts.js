import { getChannel, getChannelMessages, formatPostData } from '../utils/telegram.js';
import { errorHandler } from '../middleware/errorHandler.js';

export async function getPostStats(c) {
  try {
    const username = c.req.param('username');
    const postId = Number(c.req.param('postId'));
    const client = c.get('telegram');

    const channel = await getChannel(client, username);
    const messages = await getChannelMessages(client, channel, { ids: [postId] });
    
    if (!messages?.length) {
      throw new Error('Post not found');
    }

    const postData = formatPostData(messages[0]);
    
    return c.json({
      success: true,
      data: postData
    });
  } catch (error) {
    return errorHandler(error, c);
  }
}

export async function getPostEngagement(c) {
  try {
    const username = c.req.param('username');
    const postId = Number(c.req.param('postId'));
    const client = c.get('telegram');

    const channel = await getChannel(client, username);
    const messages = await getChannelMessages(client, channel, { ids: [postId] });
    
    if (!messages?.length) {
      throw new Error('Post not found');
    }

    const post = messages[0];
    const engagement = {
      views: post.views || 0,
      forwards: post.forwards || 0,
      replies: post.replies?.count || 0,
      reactions: post.reactions?.results?.reduce((total, reaction) => total + reaction.count, 0) || 0,
      engagement_rate: post.views ? ((post.forwards + (post.replies?.count || 0)) / post.views * 100).toFixed(2) : 0
    };

    return c.json({
      success: true,
      data: engagement
    });
  } catch (error) {
    return errorHandler(error, c);
  }
}
