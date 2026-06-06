export interface ChecklistItem {
    id: string;
    text: string;
    completed: boolean;
}

export interface Checklist {
    id: string;
    name: string;
    items: ChecklistItem[];
}

export interface PlayerStats {
    xp: number;
    level: number;
    streak: number;
    lastCompletedDate: string | null;
}