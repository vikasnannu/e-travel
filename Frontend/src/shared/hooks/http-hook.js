import React, { useState, useCallback, useRef, useEffect } from 'react';

export const useHttpClient = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState();

    const activeHttpRequest = useRef([]);

    const sendRequest = useCallback( async (url, method = 'GET', body = null, headers = {}) => {
        
        setIsLoading(true);
        const httpAbortControl = new AbortController();
        activeHttpRequest.current.push(httpAbortControl);

        try {
            const response = await fetch(url, { method, body, headers, signal: httpAbortControl.signal });
            const responseData = await response.json();
            activeHttpRequest.current = activeHttpRequest.current.filter(reqCtrl => reqCtrl !== httpAbortControl);
            if(!response.ok) throw new Error(responseData.message);
            setIsLoading(false);
            return responseData;
        }
        catch (err) {
            setError(err.message);
            setIsLoading(false);
            throw err;
        }
        
        
    }, []);

    const clearError = () => {
        setError(null);
    }

    useEffect(() => {
        return () => {
            activeHttpRequest.current.forEach(AbortCtr => AbortCtr.abort());
        };
    }, []);

    return { isLoading, error, sendRequest, clearError };
};