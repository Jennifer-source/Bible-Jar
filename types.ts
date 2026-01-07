
export interface BibleBook {
  name: string;
  chapters: number;
}

export interface ChapterIdentifier {
  bookName: string;
  chapterNumber: number;
}

export interface UserProgress {
  readChapters: string[]; // Format: "BookName-ChapterNumber"
}

export enum Mood {
  HAPPY = 'Happy',
  SAD = 'Sad',
  MOTIVATION = 'Motivation',
  FINANCIAL = 'Financial Blessings',
  FAITH = 'Faith'
}

export interface VerseRecord {
  mood: Mood;
  text: string;
  reference: string;
}
