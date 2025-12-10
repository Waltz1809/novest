"use client";

import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown } from "lucide-react";

interface DropdownOption {
    value: string;
    label: string;
}

interface CustomDropdownProps {
    options: DropdownOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
}

export default function CustomDropdown({
    options,
    value,
    onChange,
    placeholder = "Chọn...",
    disabled = false,
}: CustomDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find((opt) => opt.value === value);
    const displayText = selectedOption?.label || placeholder;

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleSelect = (optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={containerRef}>
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`
                    w-full px-4 py-3 rounded-lg bg-[#0B0C10] border text-left
                    flex items-center justify-between transition-all
                    ${isOpen
                        ? "border-[#F59E0B] ring-2 ring-[#F59E0B]/20"
                        : "border-[#F59E0B]/30 hover:border-[#F59E0B]/50"
                    }
                    ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                `}
            >
                <span className={selectedOption ? "text-gray-100" : "text-gray-500"}>
                    {displayText}
                </span>
                <ChevronDown
                    className={`w-4 h-4 text-[#F59E0B] transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
            </button>

            {isOpen && (
                <div className="absolute z-50 w-full mt-2 bg-[#0f172a] border border-white/10 rounded-lg shadow-xl shadow-black/50 animate-in fade-in zoom-in-95 duration-100 overflow-hidden">
                    <div className="max-h-60 overflow-y-auto p-1 custom-scrollbar">
                        {options.length === 0 ? (
                            <div className="p-3 text-sm text-gray-500 text-center">
                                Không có lựa chọn nào.
                            </div>
                        ) : (
                            options.map((option) => {
                                const isSelected = value === option.value;
                                return (
                                    <div
                                        key={option.value}
                                        onClick={() => handleSelect(option.value)}
                                        className={`
                                            flex items-center justify-between px-3 py-2.5 rounded-md text-sm cursor-pointer transition-colors mb-0.5
                                            ${isSelected
                                                ? "bg-[#F59E0B]/20 text-[#F59E0B]"
                                                : "text-gray-300 hover:bg-white/5 hover:text-white"
                                            }
                                        `}
                                    >
                                        <span>{option.label}</span>
                                        {isSelected && <Check className="w-4 h-4" />}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
