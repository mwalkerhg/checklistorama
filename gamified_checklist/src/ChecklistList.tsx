import { useState } from "react";
import { Checklist } from "./types";

interface ChecklistProps {
    checklists: Checklist[];
    onSelect: (checklist: Checklist) => void;
    onAdd: (name: string) => void;
    onDelete: (checklistId: string) => void;
}

function ChecklistList({ checklists, onSelect, onAdd, onDelete }: ChecklistProps) {
    const [name, setName] = useState("");

    return (
        <div>
            <h2>My Checklists</h2>
            <input
                type="text"
                placeholder="New checklist name"
                value={name}
                onChange={(e) => setName(e.target.value)}
            />
            <button
                onClick={() => {
                    onAdd(name);
                    setName("");
                }}
            >
                Add Checklist
            </button>
            <ul>
                {checklists.map((checklist) => (
                    <li key={checklist.id}>
                        <span onClick={() => onSelect(checklist)}>
                            {checklist.name}
                        </span>
                        <button
                            onClick={() => onDelete(checklist.id)}
                        >
                            X
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default ChecklistList;
