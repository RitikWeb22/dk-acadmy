/**
 * DK Academy JEE - Student Achiever & Merit Records Service
 * Centralized dynamic data management for student achievers, supporting
 * CRUD operations, search, filters by year/exam, and local/API synchronization.
 */

import type { AchieverItem } from '../types';

export interface AchieverData {
  id: string;
  name: string;
  image: string;
  score: string;
  jeeMainsScore: string;
  advRank?: string;
  bitsatRank?: string;
  rankOrCollege?: string;
  examTag: 'JEE Advanced' | 'JEE Main' | 'Foundation' | 'Boards & JEE';
  highlightTopic: string;
  year: string;
  verified: boolean;
  storySnippet?: string;
  isTopPerformer?: boolean;
}

const STORAGE_KEY = 'dk_academy_achievers_data_v2';
const EVENT_NAME = 'dk_achievers_updated';

// ─── 8 Authentic Verified Students ───
export const INITIAL_ACHIEVERS: AchieverData[] = [
  {
    id: 'ach-rishabh',
    name: 'RISHABH ANAND',
    image: '/img/RISHABH%20ANAND.png',
    score: 'JEE MAINS: 99.814%',
    jeeMainsScore: '99.814%',
    advRank: '2146',
    rankOrCollege: 'ADV RANK: 2146',
    examTag: 'JEE Advanced',
    highlightTopic: 'BATCH- 2 Year Classroom Program',
    year: '2023',
    verified: true,
    isTopPerformer: true,
    storySnippet: 'DK Sir’s non-standard calculus drills and 20–30s speed inspection methods made tackling multi-concept Advanced questions second nature.'
  },
  {
    id: 'ach-shaurya',
    name: 'SHAURYA SINGH',
    image: '/img/shaurya-singh.jpg',
    score: 'JEE MAINS: 99.5%ILE',
    jeeMainsScore: '99.5%ILE',
    advRank: '',
    rankOrCollege: 'TOP 0.1% CLUB',
    examTag: 'JEE Main',
    highlightTopic: 'BATCH- 2 Year Classroom Program',
    year: '2026',
    verified: true,
    isTopPerformer: true,
    storySnippet: 'DK Sir’s conceptual shortcut inspection techniques and rigorous advanced problem sets helped me secure 99.5%ile in JEE Mains.'
  },
  {
    id: 'ach-panache',
    name: 'PANACHE THAKAR',
    image: '/img/PANACHE%20THAKAR.png',
    score: 'JEE MAINS: 97.8%ILE',
    jeeMainsScore: '97.8%ILE',
    advRank: '',
    rankOrCollege: 'TOP 2% MERIT',
    examTag: 'JEE Main',
    highlightTopic: 'BATCH- 2 Year Classroom Program',
    year: '2026',
    verified: true,
    isTopPerformer: true,
    storySnippet: 'The small batch size and direct mentorship under DK Sir ensured every conceptual doubt was cleared from first principles.'
  },
  {
    id: 'ach-chirayu',
    name: 'CHIRAYU SETHIA',
    image: '/img/Chirayu%20Sethia.jpeg',
    score: 'JEE MAINS: 99.5% ILE',
    jeeMainsScore: '99.5% ILE',
    advRank: '6781',
    bitsatRank: '292 (2022)',
    rankOrCollege: 'ADV RANK: 6781 • BITSAT: 292',
    examTag: 'JEE Advanced',
    highlightTopic: 'BATCH- 2 Year Classroom Program',
    year: '2022',
    verified: true,
    isTopPerformer: true,
    storySnippet: 'Mastering coordinate geometry and speed-solving tricks at DK Academy helped me achieve ADV RANK 6781 and BITSAT RANK 292.'
  },
  {
    id: 'ach-ashutosh',
    name: 'ASHUTOSH SHUKLA',
    image: '/img/Ashutosh%20Shukla.jpeg',
    score: 'JEE MAINS: 99.44%ILE',
    jeeMainsScore: '99.44%ILE',
    advRank: '',
    rankOrCollege: 'TOP 0.5% CLUB',
    examTag: 'JEE Main',
    highlightTopic: 'BATCH- 2 Year Classroom Program',
    year: '2023',
    verified: true,
    isTopPerformer: true,
    storySnippet: 'Daily practice problem sets with step-by-step reasoning helped me eliminate negative marking traps and achieve 99.44%ile.'
  },
  {
    id: 'ach-harsh',
    name: 'HARSH KUMAR',
    image: '/img/Harsh%20Kumar.jpeg',
    score: 'JEE MAINS: 97.56%ILE',
    jeeMainsScore: '97.56%ILE',
    advRank: '10964',
    rankOrCollege: 'ADV RANK: 10964',
    examTag: 'JEE Advanced',
    highlightTopic: 'BATCH- 2 Year Classroom Program',
    year: '2022',
    verified: true,
    isTopPerformer: true,
    storySnippet: 'Rigorous classroom mentoring under DK Sir built strong exam stamina and deep conceptual foundations for cracking JEE Advanced.'
  },
  {
    id: 'ach-tejas',
    name: 'TEJAS ITANKAR',
    image: '/img/TEJAS%20ITANKAR.jpeg',
    score: 'JEE MAINS: 98.99%ILE',
    jeeMainsScore: '98.99%ILE',
    advRank: '',
    rankOrCollege: 'TOP 1% CLUB',
    examTag: 'JEE Main',
    highlightTopic: 'BATCH- 2 Year Classroom Program',
    year: '2022',
    verified: true,
    isTopPerformer: true,
    storySnippet: 'Systematic 10-year PYQ chapter analysis and focused mentorship turned Mathematics into my highest-scoring paper on exam day.'
  },
  {
    id: 'ach-tanishq',
    name: 'TANISHQ GUPTA',
    image: '/img/Tanishq%20Gupta.jpeg',
    score: 'JEE MAINS: 97.75%',
    jeeMainsScore: '97.75%',
    advRank: '',
    rankOrCollege: 'TOP 2.2% CLUB',
    examTag: 'JEE Main',
    highlightTopic: 'BATCH- 2 Year Classroom Program',
    year: '2023',
    verified: true,
    isTopPerformer: true,
    storySnippet: 'Clear geometric visualization and constant revision sheets kept formulas sharp without rote memorization.'
  }
];

class AchieverService {
  private getStorage(): AchieverData[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to read achievers from localStorage', e);
    }
    return INITIAL_ACHIEVERS;
  }

  private setStorage(items: AchieverData[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: items }));
    } catch (e) {
      console.warn('Failed to save achievers to localStorage', e);
    }
  }

  public getAchievers(filters?: {
    search?: string;
    year?: string;
    exam?: string;
  }): AchieverData[] {
    let items = this.getStorage();

    if (filters?.year && filters.year !== 'All') {
      items = items.filter((a) => a.year === filters.year);
    }

    if (filters?.exam && filters.exam !== 'All') {
      if (filters.exam === 'JEE Advanced') {
        items = items.filter((a) => Boolean(a.advRank) || a.examTag === 'JEE Advanced');
      } else if (filters.exam === 'BITSAT') {
        items = items.filter((a) => Boolean(a.bitsatRank));
      } else if (filters.exam === 'JEE Main') {
        items = items.filter((a) => Boolean(a.jeeMainsScore));
      }
    }

    if (filters?.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      items = items.filter((a) =>
        a.name.toLowerCase().includes(q) ||
        a.jeeMainsScore.toLowerCase().includes(q) ||
        (a.advRank && a.advRank.toLowerCase().includes(q)) ||
        (a.bitsatRank && a.bitsatRank.toLowerCase().includes(q)) ||
        a.highlightTopic.toLowerCase().includes(q) ||
        a.year.includes(q)
      );
    }

    return items;
  }

  public getYears(): string[] {
    const items = this.getStorage();
    const set = new Set<string>();
    items.forEach((a) => {
      if (a.year) set.add(a.year);
    });
    return Array.from(set).sort((a, b) => Number(b) - Number(a));
  }

  public createAchiever(data: Omit<AchieverData, 'id'>): AchieverData {
    const items = this.getStorage();
    const newAchiever: AchieverData = {
      ...data,
      id: `ach-${Date.now()}`,
      verified: true,
      isTopPerformer: data.isTopPerformer ?? true
    };
    const updated = [newAchiever, ...items];
    this.setStorage(updated);
    return newAchiever;
  }

  public updateAchiever(id: string, updates: Partial<AchieverData>): AchieverData | null {
    const items = this.getStorage();
    const idx = items.findIndex((a) => a.id === id);
    if (idx === -1) return null;

    items[idx] = {
      ...items[idx],
      ...updates
    };
    this.setStorage(items);
    return items[idx];
  }

  public deleteAchiever(id: string): boolean {
    const items = this.getStorage();
    const filtered = items.filter((a) => a.id !== id);
    if (filtered.length === items.length) return false;
    this.setStorage(filtered);
    return true;
  }

  public resetToDefault(): AchieverData[] {
    this.setStorage(INITIAL_ACHIEVERS);
    return INITIAL_ACHIEVERS;
  }

  public subscribe(callback: () => void): () => void {
    const handler = () => callback();
    window.addEventListener(EVENT_NAME, handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener(EVENT_NAME, handler);
      window.removeEventListener('storage', handler);
    };
  }
}

export const achieverService = new AchieverService();

