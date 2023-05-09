export interface Project {
    name: string;
    desc: string;
    start: number
    end: number | 'present' | 'today';
    tags: string[];
    links: string[];
    de: Partial<Project>;
    en: Partial<Project>;
}