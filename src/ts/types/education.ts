import type { EducationItem } from './index.js';

export interface Education {
    list: EducationItem[];
    title: string;
    de?: Partial<Education>;
    en?: Partial<Education>;
}