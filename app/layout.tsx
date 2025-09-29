import './globals.css';
import React from 'react';


export const metadata = {
title: 'ZHAW Map',
description: 'Interactive OSM map of ZHAW campuses with building abbreviations.'
};


export default function RootLayout({ children }: { children: React.ReactNode }) {
return (
    <html lang="de">
        <body className="h-screen w-screen bg-white text-slate-900">
        {children}
        </body>
    </html>
);
}