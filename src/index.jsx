import React from 'react';
import ReactDOM from 'react-dom/client';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import App from './App';

const theme = createTheme({
    typography: {
        fontFamily: [
            'Poppins',
            'sans-serif',
        ].join(','),
    },
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <ThemeProvider theme={theme}>
            <App />
        </ThemeProvider>
    </React.StrictMode>
);