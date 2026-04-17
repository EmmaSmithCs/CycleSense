// app/context/DateFormatContext.tsx

/*
    This file defines the DateFormatContext. 
    It provides a way to manage and access the user's preferred date format (either 'DD/MM/YYYY' or 'MM/DD/YYYY') across the app.

    Key features:
    - Uses React Context to provide the current date format and a function to update it to all components in the app.
    - Stores the user's date format preference in AsyncStorage so that it persists across app restarts.
    - Provides a utility function to format dates according to the current date format setting, with support for both 'short' and 'long' styles.

*/

// Imports
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

// Define the type for date formats
export type DateFormat = 'DD/MM/YYYY' | 'MM/DD/YYYY';

// Define the context type for date formatting
type DateFormatContextType = {
    dateFormat: DateFormat; // The current date format setting
    setDateFormat: (fmt: DateFormat) => void; // Function to update the date format setting
    formatDate: (date: Date | string, style?: 'short' | 'long') => string; // Function to format a date according to the current setting and optional style
};

// Create the context with default values
const DateFormatContext = createContext<DateFormatContextType>({
    dateFormat: 'DD/MM/YYYY', // Default date format is day/month/year
    setDateFormat: () => {},
    formatDate: () => '',
});

// Provider component to wrap the app and provide date formatting context
export function DateFormatProvider({ children }: { children: React.ReactNode }) {

    // State variable to hold the current date format, initialized to 'DD/MM/YYYY'
    const [dateFormat, setDateFormat] = useState<DateFormat>('DD/MM/YYYY');

    // Load the date format from AsyncStorage when the component mounts
    useEffect(() => {
        AsyncStorage.getItem('date_format').then((stored) => {
            if (stored === 'DD/MM/YYYY' || stored === 'MM/DD/YYYY') {
                setDateFormat(stored);
            }
        });
    }, []);

    // FormatDate function that formats a given date according to the current date format setting and optional style
    const formatDate = useCallback((date: Date | string, style?: 'short' | 'long'): string => {
        const d = typeof date === 'string' ? new Date(date) : date;

        // If the 'long' style is requested, use the built-in toLocaleDateString for a more verbose format
        if (style === 'long') {
            return d.toLocaleDateString(undefined, {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
            });
        }

        // For 'short' style or default, format the date according to the current dateFormat setting
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return dateFormat === 'DD/MM/YYYY'
            ? `${day}/${month}/${year}`
            : `${month}/${day}/${year}`;
    }, [dateFormat]);

    // Return the context provider with the current date format, the function to update it, and the formatting function
    return (
        <DateFormatContext.Provider value={{ dateFormat, setDateFormat, formatDate }}>
            {children}
        </DateFormatContext.Provider>
    );
}

// Custom hook to use the DateFormatContext in components
export const useDateFormat = () => useContext(DateFormatContext);