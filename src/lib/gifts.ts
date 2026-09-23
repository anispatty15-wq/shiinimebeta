export interface ChatGift {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

export const CHAT_GIFTS: ChatGift[] = [
  { id: 'heart', name: 'Love', emoji: '💖', color: 'from-pink-500/20 to-rose-500/20 border-pink-400/40' },
  { id: 'star', name: 'Star', emoji: '🌟', color: 'from-yellow-400/20 to-orange-400/20 border-yellow-400/40' },
  { id: 'sparkle', name: 'Sparkle', emoji: '✨', color: 'from-cyan/20 to-blue-400/20 border-cyan/40' },
  { id: 'cake', name: 'Cake', emoji: '🎂', color: 'from-violet/20 to-fuchsia-400/20 border-violet/40' },
  { id: 'flower', name: 'Flower', emoji: '🌸', color: 'from-pink-300/20 to-pink-500/20 border-pink-300/40' },
  { id: 'crown', name: 'Crown', emoji: '👑', color: 'from-amber-400/20 to-yellow-500/20 border-amber-400/40' },
];

export function getChatGift(id?: string | null): ChatGift | null {
  return CHAT_GIFTS.find((gift) => gift.id === id) ?? null;
}
