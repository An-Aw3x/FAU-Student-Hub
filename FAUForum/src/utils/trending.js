const TRENDING_WINDOW_HOURS = 7 * 24;

function toNumber(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function getAgeFromRelativeTime(relativeTime) {
  const normalizedTime = String(relativeTime || '').trim().toLowerCase();

  if (normalizedTime.includes('just now')) return 0;
  if (!normalizedTime) return Number.POSITIVE_INFINITY;

  const match = normalizedTime.match(/(\d+)\s*(minute|min|hour|hr|day|week)/);
  if (!match) return Number.POSITIVE_INFINITY;

  const value = Number(match[1]);
  const unit = match[2];

  if (unit.startsWith('minute') || unit === 'min') return value / 60;
  if (unit.startsWith('hour') || unit === 'hr') return value;
  if (unit.startsWith('day')) return value * 24;
  if (unit.startsWith('week')) return value * 7 * 24;

  return Number.POSITIVE_INFINITY;
}

function getPostAgeHours(post) {
  if (post.created_at) {
    let normalizedDate = post.created_at;

    if (typeof normalizedDate === 'string') {
      normalizedDate = normalizedDate.trim().replace(' ', 'T');

      // SQLite CURRENT_TIMESTAMP values are UTC but do not include a timezone suffix.
      const isNaiveTimestamp =
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?$/.test(normalizedDate);

      if (isNaiveTimestamp) {
        normalizedDate = `${normalizedDate}Z`;
      }
    }

    const createdTime = new Date(normalizedDate).getTime();

    if (!Number.isNaN(createdTime)) {
      return Math.max(0, (Date.now() - createdTime) / 3600000);
    }
  }

  return getAgeFromRelativeTime(post.timeAgo);
}

function normalizeTag(tag) {
  return String(tag || '')
    .trim()
    .replace(/^#/, '')
    .toLowerCase();
}

export function getPostActivity(post) {
  const upvotes = toNumber(post.upvotes);
  const likes = toNumber(post.likes);
  const downvotes = toNumber(post.downvotes);
  const votes = Math.max(upvotes, likes) - downvotes;
  const comments =
    !post.created_at && Array.isArray(post.comments)
      ? post.comments.length
      : Math.max(
          toNumber(post.commentCount),
          toNumber(post.comment_count),
          Array.isArray(post.comments) ? post.comments.length : 0
        );
  const reports = Math.max(
    toNumber(post.reportCount),
    toNumber(post.report_count),
    Array.isArray(post.reports) ? post.reports.length : toNumber(post.reports)
  );
  const ageHours = getPostAgeHours(post);
  const recencyBoost = Math.max(0, TRENDING_WINDOW_HOURS - ageHours) / 24;
  // Active conversations rank higher, while reported content is intentionally reduced.
  const engagementScore = votes + comments * 2;
  const score = Math.max(0, engagementScore + recencyBoost - reports * 8);

  return {
    votes,
    comments,
    reports,
    ageHours,
    engagement: engagementScore,
    score,
  };
}

export function getTrendingPosts(posts = [], limit = 6) {
  return posts
    .filter(post => post?.id != null && post?.title)
    .map(post => ({
      post,
      activity: getPostActivity(post),
    }))
    .filter(
      item =>
        item.activity.score > 0 &&
        item.activity.engagement > 0 &&
        item.activity.ageHours <= TRENDING_WINDOW_HOURS
    )
    .sort((first, second) => {
      const scoreDifference = second.activity.score - first.activity.score;
      if (scoreDifference !== 0) return scoreDifference;

      const commentDifference = second.activity.comments - first.activity.comments;
      if (commentDifference !== 0) return commentDifference;

      return String(first.post.title).localeCompare(String(second.post.title));
    })
    .slice(0, limit)
    .map(item => item.post);
}

export function getTrendingTags(posts = [], limit = 7) {
  const tagsByName = new Map();

  posts.forEach(post => {
    const activity = getPostActivity(post);

    if (
      activity.ageHours > TRENDING_WINDOW_HOURS ||
      activity.engagement <= 0 ||
      activity.score <= 0
    ) {
      return;
    }

    const uniqueTags = new Set((post.tags || []).map(normalizeTag).filter(Boolean));

    uniqueTags.forEach(tag => {
      if (tag === 'all') return;

      const existingTag = tagsByName.get(tag) || { tag, count: 0, score: 0 };
      existingTag.count += 1;
      existingTag.score += Math.max(1, activity.score);
      tagsByName.set(tag, existingTag);
    });
  });

  return Array.from(tagsByName.values())
    .sort((first, second) => {
      const scoreDifference = second.score - first.score;
      if (scoreDifference !== 0) return scoreDifference;

      const countDifference = second.count - first.count;
      if (countDifference !== 0) return countDifference;

      return first.tag.localeCompare(second.tag);
    })
    .slice(0, limit)
    .map(item => ({
      ...item,
      score: Math.round(item.score),
    }));
}
