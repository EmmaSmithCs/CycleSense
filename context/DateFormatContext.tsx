// context/DateFormatContext.tsx

// Imports
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export type DateFormat = 'DD/MM/YYYY' | 'MM/DD/YYYY';

type DateFormatContextType = {
    dateFormat: DateFormat;
    setDateFormat: (fmt: DateFormat) => void;
    formatDate: (date: Date | string, style?: 'short' | 'long') => string;
};

const DateFormatContext = createContext<DateFormatContextType>({
    dateFormat: 'DD/MM/YYYY',
    setDateFormat: () => {},
    formatDate: () => '',
});

export function DateFormatProvider({ children }: { children: React.ReactNode }) {
    const [dateFormat, setDateFormat] = useState<DateFormat>('DD/MM/YYYY');

    useEffect(() => {
        AsyncStorage.getItem('date_format').then((stored) => {
            if (stored === 'DD/MM/YYYY' || stored === 'MM/DD/YYYY') {
                setDateFormat(stored);
            }
        });
    }, []);

    const formatDate = useCallback((date: Date | string, style?: 'short' | 'long'): string => {
        const d = typeof date === 'string' ? new Date(date) : date;

        if (style === 'long') {
            return d.toLocaleDateString(undefined, {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
            });
        }


        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return dateFormat === 'DD/MM/YYYY'
            ? `${day}/${month}/${year}`
            : `${month}/${day}/${year}`;
    }, [dateFormat]);

    return (
        <DateFormatContext.Provider value={{ dateFormat, setDateFormat, formatDate }}>
            {children}
        </DateFormatContext.Provider>
    );
}

export const useDateFormat = () => useContext(DateFormatContext);