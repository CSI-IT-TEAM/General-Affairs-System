"use client";

import React from "react";
import { cn } from "../../lib/utils"
// --- Action Button Group Component ---

const variantStyles = {
    default: {
        bg: "bg-slate-100 dark:bg-slate-800",
        hoverBg: "hover:bg-slate-200 dark:hover:bg-slate-700",
        text: "text-slate-600 dark:text-slate-300",
        hoverText: "hover:text-slate-800 dark:hover:text-white",
        ring: "ring-slate-300 dark:ring-slate-600",
    },
    primary: {
        bg: "bg-blue-50 dark:bg-blue-900/30",
        hoverBg: "hover:bg-blue-100 dark:hover:bg-blue-800/40",
        text: "text-blue-600 dark:text-blue-400",
        hoverText: "hover:text-blue-700 dark:hover:text-blue-300",
        ring: "ring-blue-300 dark:ring-blue-600",
    },
    success: {
        bg: "bg-emerald-50 dark:bg-emerald-900/30",
        hoverBg: "hover:bg-emerald-100 dark:hover:bg-emerald-800/40",
        text: "text-emerald-600 dark:text-emerald-400",
        hoverText: "hover:text-emerald-700 dark:hover:text-emerald-300",
        ring: "ring-emerald-300 dark:ring-emerald-600",
    },
    warning: {
        bg: "bg-amber-50 dark:bg-amber-900/30",
        hoverBg: "hover:bg-amber-100 dark:hover:bg-amber-800/40",
        text: "text-amber-600 dark:text-amber-400",
        hoverText: "hover:text-amber-700 dark:hover:text-amber-300",
        ring: "ring-amber-300 dark:ring-amber-600",
    },
    danger: {
        bg: "bg-red-50 dark:bg-red-900/30",
        hoverBg: "hover:bg-red-100 dark:hover:bg-red-800/40",
        text: "text-red-600 dark:text-red-400",
        hoverText: "hover:text-red-700 dark:hover:text-red-300",
        ring: "ring-red-300 dark:ring-red-600",
    },
    info: {
        bg: "bg-sky-50 dark:bg-sky-900/30",
        hoverBg: "hover:bg-sky-100 dark:hover:bg-sky-800/40",
        text: "text-sky-600 dark:text-sky-400",
        hoverText: "hover:text-sky-700 dark:hover:text-sky-300",
        ring: "ring-sky-300 dark:ring-sky-600",
    },
    secondary: {
        bg: "bg-violet-50 dark:bg-violet-900/30",
        hoverBg: "hover:bg-violet-100 dark:hover:bg-violet-800/40",
        text: "text-violet-600 dark:text-violet-400",
        hoverText: "hover:text-violet-700 dark:hover:text-violet-300",
        ring: "ring-violet-300 dark:ring-violet-600",
    },
};

const sizeStyles = {
    sm: {
        button: "h-8 px-2.5",
        icon: "h-4 w-4",
        gap: "gap-0.5",
    },
    md: {
        button: "h-9 px-3",
        icon: "h-5 w-5",
        gap: "gap-1",
    },
    lg: {
        button: "h-10 px-4",
        icon: "h-6 w-6",
        gap: "gap-1.5",
    },
};

export const ActionButtonGroup = ({
    actions,
    className,
    orientation = "horizontal",
    size = "md",
}) => {
    const sizes = sizeStyles[size];

    return (
        <div
            className={cn(
                "inline-flex items-center overflow-visible",
                "rounded-xl",
                "bg-transparent",
                orientation === "vertical" ? "flex-col" : "flex-row",
                sizes.gap,
                className
            )}
        >
            {actions.map((action, index) => {
                const variant = variantStyles[action.variant || "default"];

                return (
                    <button
                        key={index}
                        onClick={action.onClick}
                        disabled={action.disabled}
                        title={action.title || action.label}
                        className={cn(
                            // Base styles
                            "relative flex items-center justify-center gap-1.5",
                            "rounded-lg",
                            "text-xs font-medium",
                            "transition-all duration-200 ease-out",
                            // Size
                            sizes.button,
                            "min-w-[44px]",
                            // Variant styles (only apply when not disabled)
                            !action.disabled && variant.bg,
                            !action.disabled && variant.hoverBg,
                            !action.disabled && variant.text,
                            !action.disabled && variant.hoverText,
                            // Interactive states
                            "focus-visible:outline-none focus-visible:ring-2",
                            !action.disabled && variant.ring,
                            !action.disabled && "active:scale-95",
                            // Hover animation
                            !action.disabled && "hover:shadow-md hover:-translate-y-0.5",
                            // Disabled - gray color with reduced opacity
                            action.disabled && "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 opacity-60 cursor-not-allowed pointer-events-none"
                        )}
                    >
                        <span className={cn(sizes.icon, "flex-shrink-0")}>
                            {action.icon}
                        </span>
                    </button>
                );
            })}
        </div>
    );
};

export default ActionButtonGroup;
