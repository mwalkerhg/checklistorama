import { PlayerStats } from "./types";

interface PlayerStatsBarProps {
    stats: PlayerStats;
}

function PlayerStatsBar({ stats }: PlayerStatsBarProps) {
    const xpForNext = stats.level * 100;
    const progress = Math.min((stats.xp / xpForNext) * 100, 100);

    return (
        <div className="stats-bar">
            <div className="stats-info">
                <span>Level {stats.level}</span>
                <span>{stats.xp} / {xpForNext} XP</span>
                <span>Streak: {stats.streak} day{stats.streak !== 1 ? "s" : ""}</span>
            </div>
            <div className="xp-bar-bg">
                <div
                    className="xp-bar-fill"
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
}

export default PlayerStatsBar;
