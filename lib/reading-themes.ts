export interface ReadingTheme {
    id: string
    name: string
    background: string
    foreground: string
    ui: {
        background: string
        border: string
        text: string
        hover: string
        active: string
    }
}

export const READING_THEMES: Record<string, ReadingTheme> = {
    light: {
        id: "light",
        name: "Sáng",
        background: "#f9f7f1",
        foreground: "#1f2937",
        ui: {
            background: "#ffffff",
            border: "#e5e7eb",
            text: "#374151",
            hover: "#f3f4f6",
            active: "#e5e7eb"
        }
    },
    sepia: {
        id: "sepia",
        name: "Vàng",
        background: "#f4ecd8",
        foreground: "#5b4636",
        ui: {
            background: "#e8dfc8",
            border: "#d6cbb3",
            text: "#4a3b2a",
            hover: "#dfd6bf",
            active: "#d6cbb3"
        }
    },
    dark: {
        id: "dark",
        name: "Tối",
        background: "#1f2937",
        foreground: "#f3f4f6",
        ui: {
            background: "#111827",
            border: "#374151",
            text: "#e5e7eb",
            hover: "#374151",
            active: "#4b5563"
        }
    },
    night: {
        id: "night",
        name: "Đêm",
        background: "#0B0C10",
        foreground: "#C5C6C7",
        ui: {
            background: "#1F2833",
            border: "#45A29E",
            text: "#66FCF1",
            hover: "#0B0C10",
            active: "#45A29E"
        }
    },
    onyx: {
        id: "onyx",
        name: "Onyx",
        background: "#000000",
        foreground: "#e5e5e5",
        ui: {
            background: "#1a1a1a",
            border: "#333333",
            text: "#a3a3a3",
            hover: "#262626",
            active: "#333333"
        }
    },
    dusk: {
        id: "dusk",
        name: "Dusk",
        background: "#202030",
        foreground: "#e2e2e2",
        ui: {
            background: "#2a2a3e",
            border: "#3e3e5e",
            text: "#b0b0d0",
            hover: "#34344d",
            active: "#3e3e5e"
        }
    },
    lavender: {
        id: "lavender",
        name: "Lavender",
        background: "#e6e6fa",
        foreground: "#2c2c54",
        ui: {
            background: "#dcdcf5",
            border: "#c8c8e6",
            text: "#40407a",
            hover: "#d2d2f0",
            active: "#c8c8e6"
        }
    },
    frost: {
        id: "frost",
        name: "Frost",
        background: "#f0f8ff",
        foreground: "#1e3799",
        ui: {
            background: "#e6f2ff",
            border: "#cce4ff",
            text: "#0c2461",
            hover: "#d9ebff",
            active: "#cce4ff"
        }
    },
    matcha: {
        id: "matcha",
        name: "Matcha",
        background: "#f0fff4", // Light green pastel
        foreground: "#000000", // Black text
        ui: {
            background: "#dcfce7",
            border: "#bbf7d0",
            text: "#14532d",
            hover: "#bbf7d0",
            active: "#86efac"
        }
    },
    ocean: {
        id: "ocean",
        name: "Ocean",
        background: "#f0f9ff", // Light blue pastel
        foreground: "#000000", // Black text
        ui: {
            background: "#e0f2fe",
            border: "#bae6fd",
            text: "#0c4a6e",
            hover: "#bae6fd",
            active: "#7dd3fc"
        }
    },
    strawberry: {
        id: "strawberry",
        name: "Strawberry",
        background: "#fff1f2", // Light pink pastel
        foreground: "#000000", // Black text
        ui: {
            background: "#ffe4e6",
            border: "#fecdd3",
            text: "#881337",
            hover: "#fecdd3",
            active: "#fda4af"
        }
    }
}
