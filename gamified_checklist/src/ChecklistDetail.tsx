import { useState } from "react";
import { Checklist } from "./types";

interface ChecklistDetailProps {
    checklist: Checklist;
    onAddItem: (checklistId: string, text: string) => void;
    onToggleItem: (checklistId: string, itemId: string) => void;
    onDeleteItem: (checklistId: string, itemId: string) => void;
    onBack: () => void;
}

function ChecklistDetail({
    checklist,
    onAddItem,
    onToggleItem,
    onDeleteItem,
    onBack,
}: ChecklistDetailProps) {
    const [text, setText] = useState("");

    return (
        <div>
            <button onClick={onBack}>Back to Lists</button>
            <h2>{checklist.name}</h2>
            <input
                type="text"
                placeholder="New item"
                value={text}
                onChange={(e) => setText(e.target.value)}
            />
            <button
                onClick={() => {
                    onAddItem(checklist.id, text);
                    setText("");
                }}
            >
                Add Item
            </button>
            <ul>
                {checklist.items.map((item) => (
                    <li key={item.id}>
                        <input
                            type="checkbox"
                            checked={item.completed}
                            onChange={() => onToggleItem(checklist.id, item.id)}
                        />
                        <span
                            style={{
                                textDecoration: item.completed
                                    ? "line-through"
                                    : "none",
                                opacity: item.completed ? 0.5 : 1,
                            }}
                        >
                            {item.text}
                        </span>
                        <button
                            onClick={() =>
                                onDeleteItem(checklist.id, item.id)
                            }
                        >
                            Delete
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default ChecklistDetail;
