export type Building = {
abbr: string; // e.g., "MW"
name: string; // e.g., "Technoparkstrasse 1"
dept?: string; // School / Department (optional)
address: string; // Postal address
lat?: number; // optional lat (if known)
lon?: number; // optional lon (if known)
};