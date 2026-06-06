import { useState, useEffect } from "react";
import { Checklist, ChecklistItem, PlayerStats } from "./types";
import ChecklistList from "./ChecklistList";
import ChecklistDetail from "./ChecklistDetail";
import PlayerStatsBar from "./PlayerStatsBar";
import "./App.css";

function App() {
    const [checklists, setChecklists] = useState<Checklist[]>(() => {
        const saved = localStorage.getItem("checklists");
        return saved ? JSON.parse(saved) : [];
    });
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem("theme") || "galaxy";
    });

    useEffect(() => {
        document.body.setAttribute("data-theme", theme);
        localStorage.setItem("theme", theme);
    }, [theme]);

    const [stats, setStats] = useState<PlayerStats>(() => {
        const saved = localStorage.getItem("playerStats");
        return saved
            ? JSON.parse(saved)
            : { xp: 0, level: 1, streak: 0, lastCompletedDate: null };
    });

    useEffect(() => {
        localStorage.setItem("checklists", JSON.stringify(checklists));
    }, [checklists]);

    useEffect(() => {
        localStorage.setItem("playerStats", JSON.stringify(stats));
    }, [stats]);

    function gainXp(amount: number) {
        setStats((prev) => {
            const newXp = prev.xp + amount;
            const xpForNext = prev.level * 100;
            if (newXp >= xpForNext) {
                return {
                    ...prev,
                    xp: newXp - xpForNext,
                    level: prev.level + 1,
                };
            }
            return { ...prev, xp: newXp };
        });
    }

    function updateStreak() {
        const today = new Date().toDateString();
        setStats((prev) => {
            if (prev.lastCompletedDate === today) return prev;
            const yesterday = new Date(Date.now() - 86400000).toDateString();
            const newStreak =
                prev.lastCompletedDate === yesterday ? prev.streak + 1 : 1;
            return { ...prev, streak: newStreak, lastCompletedDate: today };
        });
    }
    const selectedChecklist =
        checklists.find((cl) => cl.id === selectedId) || null;

    function addCheckList(name: string) {
        const newChecklist: Checklist = {
            id: Date.now().toString(),
            name: name,
            items: [],
        };
        setChecklists([...checklists, newChecklist]);
    }

    function addItem(checklistId: string, text: string) {
        const newItem: ChecklistItem = {
            id: Date.now().toString(),
            text: text,
            completed: false,
        };
        setChecklists(
            checklists.map((cl) =>
                cl.id === checklistId
                    ? { ...cl, items: [...cl.items, newItem] }
                    : cl,
            ),
        );
    }

    function toggleItem(checklistId: string, itemId: string) {
        const checklist = checklists.find((cl) => cl.id === checklistId);
        const item = checklist?.items.find((i) => i.id === itemId);
        if (item && !item.completed) {
            gainXp(10);
            updateStreak();
        }
        setChecklists(
            checklists.map((cl) =>
                cl.id === checklistId
                    ? {
                          ...cl,
                          items: cl.items.map((i) =>
                              i.id === itemId
                                  ? { ...i, completed: !i.completed }
                                  : i,
                          ),
                      }
                    : cl,
            ),
        );
    }

    function deleteChecklist(checklistId: string) {
        setChecklists(checklists.filter((cl) => cl.id !== checklistId));
        if (selectedId === checklistId) {
            setSelectedId(null);
        }
    }

    function deleteItem(checklistId: string, itemId: string) {
        setChecklists(
            checklists.map((cl) =>
                cl.id === checklistId
                    ? {
                          ...cl,
                          items: cl.items.filter((item) => item.id !== itemId),
                      }
                    : cl,
            ),
        );
    }

    return (
        <div>
            <div className="theme-selector">
                <select
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                >
                    <option value="galaxy">Galaxy</option>
                    <option value="mario">Mario</option>
                    <option value="zelda">Zelda</option>                </select>
            </div>
            <h1>Gamified Checklist</h1>
            <PlayerStatsBar stats={stats} />
            {selectedChecklist ? (
                <ChecklistDetail
                    checklist={selectedChecklist}
                    onAddItem={addItem}
                    onToggleItem={toggleItem}
                    onDeleteItem={deleteItem}
                    onBack={() => setSelectedId(null)}
                />
            ) : (
                <ChecklistList
                    checklists={checklists}
                    onSelect={(checklist) => setSelectedId(checklist.id)}
                    onAdd={addCheckList}
                    onDelete={deleteChecklist}
                />
            )}
        </div>
    );
}

export default App;
