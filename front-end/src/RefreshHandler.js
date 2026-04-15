import { useEffect } from 'react';

function RefreshHandler({ setIsAuthenticated }) {

    useEffect(() => {
        const token = localStorage.getItem('token');

        if (token) {
            setIsAuthenticated(true);
        } else {
            setIsAuthenticated(false);
        }
    }, [setIsAuthenticated]);

    return null;
}

export default RefreshHandler;