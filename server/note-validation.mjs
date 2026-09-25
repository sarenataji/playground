export const COLORS = ['butter', 'rose', 'sage', 'sky'];
export const STAMPS = ['flower', 'star', 'heart', 'smile'];
export function validateNote(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  const { message, name, color, stamp, requestId, website } = body;
  if (typeof message !== 'string' || !message.trim() || message.length > 1000 ||
      typeof name !== 'string' || name.length > 50 ||
      !COLORS.includes(color) || !STAMPS.includes(stamp) ||
      typeof requestId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId) ||
      (website !== undefined && website !== '')) return null;
  return { message: message.trim(), name: name.trim(), color, stamp, requestId };
}
