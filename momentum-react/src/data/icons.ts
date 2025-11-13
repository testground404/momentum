export interface IconOption {
  emoji: string;
  name: string;
  category: string;
  keywords: string[];
}

export const ICON_CATEGORIES = [
  'All',
  'Sports & Fitness',
  'Health & Wellness',
  'Work & Productivity',
  'Learning',
  'Hobbies',
  'Lifestyle',
  'Emotions',
  'Nature',
  'Food & Drink',
  'Technology',
  'Travel',
] as const;

export type IconCategory = (typeof ICON_CATEGORIES)[number];

export const HABIT_ICONS: IconOption[] = [
  // Sports & Fitness
  { emoji: '💪', name: 'Muscle', category: 'Sports & Fitness', keywords: ['exercise', 'workout', 'gym', 'strength', 'fitness'] },
  { emoji: '🏃', name: 'Running', category: 'Sports & Fitness', keywords: ['run', 'jog', 'cardio', 'exercise'] },
  { emoji: '🏋️', name: 'Weightlifting', category: 'Sports & Fitness', keywords: ['weights', 'gym', 'strength', 'training'] },
  { emoji: '🚴', name: 'Cycling', category: 'Sports & Fitness', keywords: ['bike', 'bicycle', 'exercise', 'cardio'] },
  { emoji: '🏊', name: 'Swimming', category: 'Sports & Fitness', keywords: ['swim', 'pool', 'water', 'exercise'] },
  { emoji: '🧘', name: 'Yoga', category: 'Sports & Fitness', keywords: ['meditation', 'stretch', 'flexibility', 'zen'] },
  { emoji: '⚽', name: 'Soccer', category: 'Sports & Fitness', keywords: ['football', 'sport', 'ball'] },
  { emoji: '🏀', name: 'Basketball', category: 'Sports & Fitness', keywords: ['sport', 'ball', 'hoop'] },
  { emoji: '🎾', name: 'Tennis', category: 'Sports & Fitness', keywords: ['sport', 'racket', 'ball'] },
  { emoji: '🥊', name: 'Boxing', category: 'Sports & Fitness', keywords: ['fighting', 'training', 'workout'] },

  // Health & Wellness
  { emoji: '💊', name: 'Medication', category: 'Health & Wellness', keywords: ['medicine', 'pills', 'health', 'supplement'] },
  { emoji: '🧴', name: 'Skincare', category: 'Health & Wellness', keywords: ['beauty', 'lotion', 'routine'] },
  { emoji: '🦷', name: 'Dental', category: 'Health & Wellness', keywords: ['teeth', 'brush', 'floss', 'hygiene'] },
  { emoji: '💤', name: 'Sleep', category: 'Health & Wellness', keywords: ['rest', 'bed', 'night', 'zzz'] },
  { emoji: '🧠', name: 'Mental Health', category: 'Health & Wellness', keywords: ['brain', 'mind', 'therapy', 'wellness'] },
  { emoji: '❤️', name: 'Heart Health', category: 'Health & Wellness', keywords: ['cardio', 'love', 'care'] },
  { emoji: '🩺', name: 'Medical', category: 'Health & Wellness', keywords: ['doctor', 'checkup', 'health'] },
  { emoji: '💆', name: 'Massage', category: 'Health & Wellness', keywords: ['relax', 'spa', 'wellness'] },
  { emoji: '🧼', name: 'Hygiene', category: 'Health & Wellness', keywords: ['clean', 'wash', 'soap'] },
  { emoji: '😌', name: 'Calm', category: 'Health & Wellness', keywords: ['peace', 'relax', 'meditation'] },

  // Work & Productivity
  { emoji: '💼', name: 'Work', category: 'Work & Productivity', keywords: ['job', 'business', 'briefcase', 'professional'] },
  { emoji: '📝', name: 'Writing', category: 'Work & Productivity', keywords: ['note', 'journal', 'document', 'pen'] },
  { emoji: '📊', name: 'Analytics', category: 'Work & Productivity', keywords: ['chart', 'data', 'statistics', 'graph'] },
  { emoji: '✅', name: 'Task Complete', category: 'Work & Productivity', keywords: ['done', 'check', 'finish', 'accomplish'] },
  { emoji: '📅', name: 'Calendar', category: 'Work & Productivity', keywords: ['schedule', 'plan', 'date', 'organize'] },
  { emoji: '⏰', name: 'Alarm', category: 'Work & Productivity', keywords: ['time', 'clock', 'wake', 'reminder'] },
  { emoji: '💡', name: 'Ideas', category: 'Work & Productivity', keywords: ['light', 'bulb', 'creative', 'innovation'] },
  { emoji: '🎯', name: 'Goal', category: 'Work & Productivity', keywords: ['target', 'aim', 'focus', 'achievement'] },
  { emoji: '📧', name: 'Email', category: 'Work & Productivity', keywords: ['mail', 'message', 'inbox'] },
  { emoji: '📞', name: 'Phone', category: 'Work & Productivity', keywords: ['call', 'contact', 'communication'] },

  // Learning
  { emoji: '📚', name: 'Reading', category: 'Learning', keywords: ['book', 'study', 'learn', 'literature'] },
  { emoji: '✏️', name: 'Study', category: 'Learning', keywords: ['pencil', 'write', 'learn', 'homework'] },
  { emoji: '🎓', name: 'Education', category: 'Learning', keywords: ['graduate', 'school', 'university', 'learn'] },
  { emoji: '🧮', name: 'Math', category: 'Learning', keywords: ['calculate', 'numbers', 'abacus'] },
  { emoji: '🔬', name: 'Science', category: 'Learning', keywords: ['experiment', 'lab', 'research'] },
  { emoji: '🌍', name: 'Geography', category: 'Learning', keywords: ['world', 'earth', 'globe', 'travel'] },
  { emoji: '🗣️', name: 'Language', category: 'Learning', keywords: ['speak', 'talk', 'communication'] },
  { emoji: '🎨', name: 'Art', category: 'Learning', keywords: ['paint', 'draw', 'creative', 'design'] },
  { emoji: '🎵', name: 'Music', category: 'Learning', keywords: ['song', 'play', 'instrument', 'melody'] },
  { emoji: '📖', name: 'Book', category: 'Learning', keywords: ['read', 'novel', 'story', 'literature'] },

  // Hobbies
  { emoji: '🎮', name: 'Gaming', category: 'Hobbies', keywords: ['video', 'game', 'play', 'console'] },
  { emoji: '🎬', name: 'Movies', category: 'Hobbies', keywords: ['film', 'cinema', 'watch', 'entertainment'] },
  { emoji: '📺', name: 'TV', category: 'Hobbies', keywords: ['television', 'show', 'watch', 'series'] },
  { emoji: '🎭', name: 'Theater', category: 'Hobbies', keywords: ['drama', 'performance', 'acting'] },
  { emoji: '🎸', name: 'Guitar', category: 'Hobbies', keywords: ['music', 'instrument', 'play', 'rock'] },
  { emoji: '🎹', name: 'Piano', category: 'Hobbies', keywords: ['music', 'keyboard', 'instrument', 'play'] },
  { emoji: '📷', name: 'Photography', category: 'Hobbies', keywords: ['camera', 'photo', 'picture', 'shoot'] },
  { emoji: '🖼️', name: 'Painting', category: 'Hobbies', keywords: ['art', 'canvas', 'draw', 'creative'] },
  { emoji: '🧩', name: 'Puzzle', category: 'Hobbies', keywords: ['game', 'solve', 'brain', 'piece'] },
  { emoji: '🎲', name: 'Board Game', category: 'Hobbies', keywords: ['dice', 'play', 'game', 'fun'] },

  // Lifestyle
  { emoji: '🏠', name: 'Home', category: 'Lifestyle', keywords: ['house', 'living', 'domestic'] },
  { emoji: '🧹', name: 'Cleaning', category: 'Lifestyle', keywords: ['clean', 'tidy', 'broom', 'chore'] },
  { emoji: '🧺', name: 'Laundry', category: 'Lifestyle', keywords: ['wash', 'clothes', 'chore'] },
  { emoji: '🛒', name: 'Shopping', category: 'Lifestyle', keywords: ['buy', 'groceries', 'store', 'cart'] },
  { emoji: '🍳', name: 'Cooking', category: 'Lifestyle', keywords: ['food', 'kitchen', 'meal', 'recipe'] },
  { emoji: '🌱', name: 'Gardening', category: 'Lifestyle', keywords: ['plant', 'grow', 'garden', 'nature'] },
  { emoji: '🐕', name: 'Pet Care', category: 'Lifestyle', keywords: ['dog', 'animal', 'care', 'walk'] },
  { emoji: '👨‍👩‍👧', name: 'Family', category: 'Lifestyle', keywords: ['parents', 'children', 'together'] },
  { emoji: '👫', name: 'Social', category: 'Lifestyle', keywords: ['friends', 'people', 'together', 'hang out'] },
  { emoji: '💑', name: 'Relationship', category: 'Lifestyle', keywords: ['couple', 'love', 'partner'] },

  // Emotions
  { emoji: '😊', name: 'Happy', category: 'Emotions', keywords: ['smile', 'joy', 'pleased', 'glad'] },
  { emoji: '😴', name: 'Tired', category: 'Emotions', keywords: ['sleepy', 'exhausted', 'rest'] },
  { emoji: '😤', name: 'Determined', category: 'Emotions', keywords: ['motivated', 'focused', 'driven'] },
  { emoji: '🥳', name: 'Celebrate', category: 'Emotions', keywords: ['party', 'success', 'achievement'] },
  { emoji: '🤗', name: 'Grateful', category: 'Emotions', keywords: ['thankful', 'appreciate', 'hug'] },
  { emoji: '😇', name: 'Peaceful', category: 'Emotions', keywords: ['angel', 'calm', 'serene'] },
  { emoji: '🤔', name: 'Thinking', category: 'Emotions', keywords: ['ponder', 'consider', 'reflect'] },
  { emoji: '💪', name: 'Strong', category: 'Emotions', keywords: ['powerful', 'confident', 'resilient'] },
  { emoji: '🙏', name: 'Grateful', category: 'Emotions', keywords: ['pray', 'thank', 'blessing'] },
  { emoji: '✨', name: 'Sparkle', category: 'Emotions', keywords: ['shine', 'glow', 'special'] },

  // Nature
  { emoji: '🌞', name: 'Sunshine', category: 'Nature', keywords: ['sun', 'bright', 'day', 'morning'] },
  { emoji: '🌙', name: 'Moon', category: 'Nature', keywords: ['night', 'evening', 'lunar'] },
  { emoji: '⭐', name: 'Star', category: 'Nature', keywords: ['night', 'shine', 'sky'] },
  { emoji: '🌈', name: 'Rainbow', category: 'Nature', keywords: ['color', 'sky', 'weather'] },
  { emoji: '🌸', name: 'Flower', category: 'Nature', keywords: ['bloom', 'plant', 'spring', 'garden'] },
  { emoji: '🌳', name: 'Tree', category: 'Nature', keywords: ['forest', 'nature', 'environment'] },
  { emoji: '🍃', name: 'Leaf', category: 'Nature', keywords: ['nature', 'plant', 'green'] },
  { emoji: '🌊', name: 'Wave', category: 'Nature', keywords: ['ocean', 'sea', 'water'] },
  { emoji: '🔥', name: 'Fire', category: 'Nature', keywords: ['flame', 'burn', 'hot', 'energy'] },
  { emoji: '💧', name: 'Water', category: 'Nature', keywords: ['drop', 'liquid', 'hydrate'] },

  // Food & Drink
  { emoji: '🍎', name: 'Apple', category: 'Food & Drink', keywords: ['fruit', 'healthy', 'food'] },
  { emoji: '🥗', name: 'Salad', category: 'Food & Drink', keywords: ['healthy', 'vegetables', 'food'] },
  { emoji: '🥤', name: 'Drink', category: 'Food & Drink', keywords: ['beverage', 'liquid', 'cup'] },
  { emoji: '☕', name: 'Coffee', category: 'Food & Drink', keywords: ['caffeine', 'drink', 'morning', 'energy'] },
  { emoji: '🍵', name: 'Tea', category: 'Food & Drink', keywords: ['drink', 'hot', 'beverage'] },
  { emoji: '💧', name: 'Water', category: 'Food & Drink', keywords: ['hydrate', 'drink', 'healthy'] },
  { emoji: '🥛', name: 'Milk', category: 'Food & Drink', keywords: ['drink', 'dairy', 'calcium'] },
  { emoji: '🍌', name: 'Banana', category: 'Food & Drink', keywords: ['fruit', 'healthy', 'snack'] },
  { emoji: '🥑', name: 'Avocado', category: 'Food & Drink', keywords: ['healthy', 'food', 'fruit'] },
  { emoji: '🍇', name: 'Grapes', category: 'Food & Drink', keywords: ['fruit', 'healthy', 'snack'] },

  // Technology
  { emoji: '💻', name: 'Computer', category: 'Technology', keywords: ['laptop', 'work', 'tech', 'code'] },
  { emoji: '📱', name: 'Phone', category: 'Technology', keywords: ['mobile', 'device', 'tech'] },
  { emoji: '⌚', name: 'Watch', category: 'Technology', keywords: ['time', 'wearable', 'smartwatch'] },
  { emoji: '🖥️', name: 'Desktop', category: 'Technology', keywords: ['computer', 'monitor', 'work'] },
  { emoji: '⌨️', name: 'Keyboard', category: 'Technology', keywords: ['type', 'computer', 'input'] },
  { emoji: '🖱️', name: 'Mouse', category: 'Technology', keywords: ['computer', 'click', 'input'] },
  { emoji: '🎧', name: 'Headphones', category: 'Technology', keywords: ['music', 'audio', 'listen'] },
  { emoji: '📡', name: 'Satellite', category: 'Technology', keywords: ['signal', 'communication', 'tech'] },
  { emoji: '🔌', name: 'Plug', category: 'Technology', keywords: ['power', 'electric', 'charge'] },
  { emoji: '🔋', name: 'Battery', category: 'Technology', keywords: ['power', 'energy', 'charge'] },

  // Travel
  { emoji: '✈️', name: 'Airplane', category: 'Travel', keywords: ['flight', 'travel', 'vacation'] },
  { emoji: '🚗', name: 'Car', category: 'Travel', keywords: ['drive', 'vehicle', 'transport'] },
  { emoji: '🚆', name: 'Train', category: 'Travel', keywords: ['rail', 'travel', 'transport'] },
  { emoji: '🚲', name: 'Bicycle', category: 'Travel', keywords: ['bike', 'ride', 'transport'] },
  { emoji: '🛴', name: 'Scooter', category: 'Travel', keywords: ['ride', 'transport', 'kick'] },
  { emoji: '🗺️', name: 'Map', category: 'Travel', keywords: ['navigate', 'location', 'direction'] },
  { emoji: '🧳', name: 'Luggage', category: 'Travel', keywords: ['suitcase', 'bag', 'travel', 'vacation'] },
  { emoji: '🏖️', name: 'Beach', category: 'Travel', keywords: ['vacation', 'sand', 'ocean', 'relax'] },
  { emoji: '🏔️', name: 'Mountain', category: 'Travel', keywords: ['hike', 'nature', 'adventure'] },
  { emoji: '🏕️', name: 'Camping', category: 'Travel', keywords: ['tent', 'outdoor', 'nature', 'adventure'] },
];

export const DEFAULT_COLORS = [
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Indigo', value: '#6366f1' },
];
