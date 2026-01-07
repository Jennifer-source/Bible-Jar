
import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { BIBLE_BOOKS } from './data/bibleData';
import { Mood, VerseRecord } from './types';

// Constants
const TOTAL_CHAPTERS = 1189;
const STORAGE_KEY = 'bible-jar-progress-v1';

// Mood Verses (KJV Based)
const MOOD_VERSES: VerseRecord[] = [
  { mood: Mood.HAPPY, text: "Rejoice in the Lord alway: and again I say, Rejoice.", reference: "Philippians 4:4" },
  { mood: Mood.HAPPY, text: "This is the day which the Lord hath made; we will rejoice and be glad in it.", reference: "Psalm 118:24" },
  { mood: Mood.SAD, text: "The Lord is nigh unto them that are of a broken heart; and saveth such as be of a contrite spirit.", reference: "Psalm 34:18" },
  { mood: Mood.SAD, text: "For his anger endureth but a moment; in his favour is life: weeping may endure for a night, but joy cometh in the morning.", reference: "Psalm 30:5" },
  { mood: Mood.MOTIVATION, text: "I can do all things through Christ which strengtheneth me.", reference: "Philippians 4:13" },
  { mood: Mood.MOTIVATION, text: "But they that wait upon the Lord shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint.", reference: "Isaiah 40:31" },
  { mood: Mood.FINANCIAL, text: "But my God shall supply all your need according to his riches in glory by Christ Jesus.", reference: "Philippians 4:19" },
  { mood: Mood.FAITH, text: "Now faith is the substance of things hoped for, the evidence of things not seen.", reference: "Hebrews 11:1" },
];

function App() {
  const [view, setView] = useState<'home' | 'read' | 'verses' | 'progress' | 'bible_browser'>('home');
  const [readChapters, setReadChapters] = useState<string[]>([]);
  const [currentContent, setCurrentContent] = useState<{ book: string, chapter: number, verse?: string, text: string } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [jarType, setJarType] = useState<'chapter' | 'verse'>('chapter');

  // Bible Browser State
  const [browserBook, setBrowserBook] = useState<string>(BIBLE_BOOKS[0].name);
  const [browserChapter, setBrowserChapter] = useState<number>(1);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setReadChapters(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse progress", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(readChapters));
  }, [readChapters]);

 const fetchScripture = async (
  book: string,
  chapter: number,
  onlyOneVerse: boolean = false
) => {
  setIsLoading(true);
  try {
    const response = await fetch(
      `https://bible-api.com/${encodeURIComponent(book)}%20${chapter}?translation=kjv`
    );

    const data = await response.json();

    if (!data.verses) {
      throw new Error("No verses found");
    }

    const text = onlyOneVerse
      ? data.verses[Math.floor(Math.random() * data.verses.length)].text
      : data.verses.map((v: any) => `${v.verse}. ${v.text}`).join("\n");

    setCurrentContent({
      book,
      chapter,
      text,
      verse: onlyOneVerse ? "Selection" : undefined,
    });

    setView("read");
  } catch (err) {
    alert("Scripture not available.");
  } finally {
    setIsLoading(false);
  }
};


  const pickFromJar = () => {
    const unread: { book: string, chapter: number }[] = [];
    BIBLE_BOOKS.forEach(book => {
      for (let i = 1; i <= book.chapters; i++) {
        if (!readChapters.includes(`${book.name}-${i}`)) {
          unread.push({ book: book.name, chapter: i });
        }
      }
    });

    if (unread.length === 0) {
      alert("The jar is empty! You have completed the Bible. Reset progress to start over.");
      return;
    }

    const random = unread[Math.floor(Math.random() * unread.length)];
    fetchScripture(random.book, random.chapter, jarType === 'verse');
  };

  const markAsRead = () => {
    if (currentContent) {
      const id = `${currentContent.book}-${currentContent.chapter}`;
      if (!readChapters.includes(id)) {
        setReadChapters(prev => [...prev, id]);
      }
      setView('home');
      setCurrentContent(null);
    }
  };

  const handleBrowse = async (book: string, chapter: number) => {
    fetchScripture(book, chapter, false);
  };

  const currentMoodVerse = useMemo(() => {
    if (!selectedMood) return null;
    const filtered = MOOD_VERSES.filter(v => v.mood === selectedMood);
    return filtered[Math.floor(Math.random() * filtered.length)];
  }, [selectedMood]);

  const selectedBookData = BIBLE_BOOKS.find(b => b.name === browserBook);

  return (
    <div className="min-h-screen bg-[#fdfcf9] text-slate-900 selection:bg-amber-100 pb-20">
      <div className="max-w-xl mx-auto px-6 py-10">
        
        {/* Navigation / Header */}
        <header className="flex justify-between items-center mb-10">
          <div onClick={() => setView('home')} className="cursor-pointer">
            <h1 className="text-3xl font-bold text-amber-900 serif">Bible Jar</h1>
            <p className="text-amber-700/60 text-sm italic">One day. One chapter.</p>
          </div>
          {view !== 'home' && (
            <button 
              onClick={() => setView('home')}
              className="text-amber-800 font-medium text-sm hover:underline"
            >
              Back Home
            </button>
          )}
        </header>

        <main>
          {view === 'home' && (
            <div className="grid gap-6">
              {/* Jar Card */}
              <div className="bg-white p-2 rounded-[2rem] shadow-xl shadow-amber-900/5 border border-amber-100">
                <div className="p-6">
                   <span className="text-amber-600 text-[10px] font-bold uppercase tracking-widest block mb-4 text-center">Your Daily Selection</span>
                   
                   <div className="flex bg-slate-50 p-1 rounded-2xl mb-6">
                      <button 
                        onClick={() => setJarType('chapter')}
                        className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${jarType === 'chapter' ? 'bg-white shadow-sm text-amber-900' : 'text-slate-400'}`}
                      >
                        Whole Chapter
                      </button>
                      <button 
                        onClick={() => setJarType('verse')}
                        className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${jarType === 'verse' ? 'bg-white shadow-sm text-amber-900' : 'text-slate-400'}`}
                      >
                        One Verse
                      </button>
                   </div>

                   <button 
                    disabled={isLoading}
                    onClick={pickFromJar}
                    className="w-full group relative overflow-hidden bg-amber-800 text-white p-8 rounded-2xl shadow-lg hover:shadow-amber-900/20 hover:scale-[1.01] transition-all text-center"
                  >
                    <div className="relative z-10">
                      {isLoading ? (
                         <div className="flex flex-col items-center gap-2">
                           <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                           <span className="text-sm font-medium animate-pulse">Shaking the jar...</span>
                         </div>
                      ) : (
                        <>
                          <h3 className="text-2xl font-bold serif">Pick from the Jar</h3>
                          <p className="text-amber-200/70 text-sm mt-1">Get a random {jarType === 'chapter' ? 'chapter' : 'verse'}</p>
                        </>
                      )}
                    </div>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setView('bible_browser')}
                  className="bg-white border border-amber-100 p-6 rounded-3xl hover:bg-amber-50 transition-all text-left"
                >
                  <h4 className="font-bold text-amber-900">Browse Bible</h4>
                  <p className="text-xs text-slate-500 mt-1">Read any book.</p>
                </button>
                <button 
                  onClick={() => setView('verses')}
                  className="bg-white border border-amber-100 p-6 rounded-3xl hover:bg-amber-50 transition-all text-left"
                >
                  <h4 className="font-bold text-amber-900">Mood Verses</h4>
                  <p className="text-xs text-slate-500 mt-1">Specific guidance.</p>
                </button>
              </div>

              <button 
                onClick={() => setView('progress')}
                className="bg-emerald-50 border border-emerald-100 p-6 rounded-3xl hover:bg-emerald-100 transition-all text-left flex justify-between items-center"
              >
                <div>
                  <h4 className="font-bold text-emerald-900">Progress</h4>
                  <p className="text-xs text-emerald-700 mt-1">
                    {readChapters.length} of {TOTAL_CHAPTERS} chapters
                  </p>
                </div>
                <div className="text-2xl font-bold text-emerald-800">
                  {Math.round((readChapters.length / TOTAL_CHAPTERS) * 100)}%
                </div>
              </button>
            </div>
          )}

          {view === 'read' && currentContent && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-amber-50 mb-6">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-amber-900 serif mb-2">{currentContent.book}</h2>
                  <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                    Chapter {currentContent.chapter} {currentContent.verse ? '• One Verse' : ''}
                  </span>
                </div>

                <div className={`serif leading-relaxed text-slate-800 mb-10 ${currentContent.verse ? 'text-2xl text-center italic py-10' : 'text-lg'}`}>
                  <div className="whitespace-pre-wrap select-text">{currentContent.text}</div>
                </div>

                <div className="flex flex-col gap-3">
                  {jarType === 'chapter' && !currentContent.verse && (
                    <button 
                      onClick={markAsRead}
                      className="w-full bg-emerald-700 text-white py-4 rounded-2xl font-bold hover:bg-emerald-800 transition-colors shadow-lg shadow-emerald-700/20"
                    >
                      Mark as Read
                    </button>
                  )}
                  <button 
                    onClick={() => setView('home')}
                    className="w-full bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold hover:bg-slate-200 transition-colors"
                  >
                    Done Reading
                  </button>
                </div>
              </div>
            </div>
          )}

          {view === 'bible_browser' && (
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-amber-50">
              <h3 className="text-xl font-bold text-amber-900 mb-6 serif">Select a Scripture</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Book</label>
                  <select 
                    value={browserBook}
                    onChange={(e) => {
                      setBrowserBook(e.target.value);
                      setBrowserChapter(1);
                    }}
                    className="w-full p-3 rounded-xl border border-amber-100 bg-amber-50/30 focus:outline-none focus:ring-2 focus:ring-amber-200 appearance-none"
                  >
                    {BIBLE_BOOKS.map(b => (
                      <option key={b.name} value={b.name}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Chapter</label>
                  <div className="grid grid-cols-5 gap-2 max-h-60 overflow-y-auto p-1 scrollbar-hide">
                    {Array.from({ length: selectedBookData?.chapters || 0 }, (_, i) => i + 1).map(num => (
                      <button
                        key={num}
                        onClick={() => setBrowserChapter(num)}
                        className={`p-2 rounded-lg text-sm transition-all ${
                          browserChapter === num 
                          ? 'bg-amber-800 text-white font-bold shadow-md' 
                          : 'bg-slate-50 text-slate-600 hover:bg-amber-100'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
                <button 
                  disabled={isLoading}
                  onClick={() => handleBrowse(browserBook, browserChapter)}
                  className="w-full bg-amber-800 text-white py-4 rounded-2xl font-bold mt-4 hover:bg-amber-900 transition-all disabled:opacity-50"
                >
                  {isLoading ? 'Loading...' : 'Read Chapter'}
                </button>
              </div>
            </div>
          )}

          {view === 'verses' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-3">
                {Object.values(Mood).map(mood => (
                  <button
                    key={mood}
                    onClick={() => setSelectedMood(mood)}
                    className={`p-4 rounded-2xl text-sm font-bold transition-all border ${
                      selectedMood === mood 
                      ? 'bg-amber-800 text-white border-amber-800' 
                      : 'bg-white text-amber-900 border-amber-100 hover:bg-amber-50 shadow-sm'
                    }`}
                  >
                    {mood}
                  </button>
                ))}
              </div>

              {selectedMood && currentMoodVerse && (
                <div className="animate-in slide-in-from-top-2 duration-300">
                  <div className="bg-amber-50/50 p-8 rounded-3xl border border-amber-100 relative overflow-hidden">
                    <p className="serif text-xl text-amber-900 mb-6 leading-relaxed italic text-center">"{currentMoodVerse.text}"</p>
                    <p className="text-center text-[10px] font-bold text-amber-700 tracking-[0.2em] uppercase">— {currentMoodVerse.reference}</p>
                    <div className="absolute top-0 left-0 w-1 h-full bg-amber-800" />
                  </div>
                  <button 
                    onClick={() => setSelectedMood(null)}
                    className="w-full text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest py-6 hover:text-slate-600"
                  >
                    Pick another mood
                  </button>
                </div>
              )}
            </div>
          )}

          {view === 'progress' && (
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-amber-50">
              <h3 className="text-2xl font-bold text-amber-900 mb-8 serif">Your Journey</h3>
              
              <div className="space-y-8">
                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-4xl font-bold text-amber-900">{readChapters.length}</span>
                    <span className="text-slate-400 ml-2">/ {TOTAL_CHAPTERS}</span>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">Chapters Read</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-emerald-600">
                      {Math.round((readChapters.length / TOTAL_CHAPTERS) * 100)}%
                    </span>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">Completion</p>
                  </div>
                </div>

                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-1000 ease-out"
                    style={{ width: `${(readChapters.length / TOTAL_CHAPTERS) * 100}%` }}
                  />
                </div>

                <div className="pt-6 border-t border-slate-50 flex justify-between items-center">
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest">
                    Started Jan 2026
                  </p>
                  <button 
                    onClick={() => {
                      if(confirm("Are you sure? This will delete all your reading history.")) {
                        setReadChapters([]);
                        localStorage.removeItem(STORAGE_KEY);
                        setView('home');
                      }
                    }}
                    className="text-red-400 text-[10px] font-bold uppercase tracking-widest hover:text-red-600 transition-colors"
                  >
                    Reset Journey
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>

        <footer className="mt-20 text-center opacity-30">
          <p className="text-slate-400 text-[10px] uppercase tracking-[0.3em]">Bible Jar Devotions</p>
        </footer>
      </div>
    </div>
  );
}

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
