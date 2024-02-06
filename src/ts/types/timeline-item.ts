export interface TimelineItem {
    name?: string;
    tags?: string[];
    links?: string[];
    start?: number | string;
    end?: number | string;
    de?: {
        desc: string;
    }
    en?: {
        desc: string;
    }
    desc?: string;
    [key: string]: any;
}