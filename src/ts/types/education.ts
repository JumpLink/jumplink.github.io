export interface Education {
    name: string;
    school: string;
    location: string;
    start: number
    end: number | 'present' | 'today';
    de: Partial<Education>;
    en: Partial<Education>;
}