export interface EducationItem {
    name: string;
    school: string;
    location: string;
    start: number
    end: number | 'present' | 'today';
    de: Partial<EducationItem>;
    en: Partial<EducationItem>;
}