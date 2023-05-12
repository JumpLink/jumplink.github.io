export interface ProjectItem {
    name: string;
    desc: string;
    start: number
    end: number | 'present' | 'today';
    tags: string[];
    links: string[];
    de: Partial<ProjectItem>;
    en: Partial<ProjectItem>;
}