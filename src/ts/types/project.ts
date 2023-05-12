import type { ProjectItem } from './index.js';

export interface Project {
    list: ProjectItem[];
    title: string;
    de?: Partial<Project>;
    en?: Partial<Project>;
}