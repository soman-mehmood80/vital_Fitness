import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { getInitialTheme, applyTheme, toggleTheme } from "../../utils/theme";

export default function ThemeToggle() {
    const [theme, setTheme] = useState(getInitialTheme);

    useEffect(() => {
        applyTheme(theme);
    }, []);

    const handleClick = () => {
        const next = toggleTheme();
        setTheme(next);
    };

    return (
        <button
            type="button"
            className="theme-toggle"
            onClick={handleClick}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
    );
}