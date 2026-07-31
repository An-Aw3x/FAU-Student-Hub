export const DEFAULT_AVATAR = '/default-avatar.png';

export function getAvatarOrDefault(avatar) {
  const avatarUrl = typeof avatar === 'string' ? avatar.trim() : '';

  if (!avatarUrl || avatarUrl.includes('api.dicebear.com')) {
    return DEFAULT_AVATAR;
  }

  return avatarUrl;
}

export function handleAvatarError(event) {
  const image = event.currentTarget;

  if (!image.src.endsWith(DEFAULT_AVATAR)) {
    image.src = DEFAULT_AVATAR;
  }
}
