// ConnectionContext.js
import React, { createContext, useContext, useRef } from 'react';

const ConnectionContext = createContext();

export const useConnectionContext = () => useContext(ConnectionContext);

export const Manager = ({ children }) => {
    const ObjectCounter = useRef(0);

    const connections = useRef([]);
    const components = useRef([{}]);

    const isConnecting = useRef(false);
    const srcGroup = useRef(null);
    const srcPin = useRef(null);
    const dstGroup = useRef(null);
    const dstPin = useRef(null);
    const isDisconnecting = useRef(false);
    const forest = useRef({});
    const tempVal = useRef(null);

    return (
        <ConnectionContext.Provider value={{
            ObjectCounter,
            connections,
            components,
            isConnecting,
            srcGroup,
            srcPin,
            dstGroup,
            dstPin,
            isDisconnecting,
            forest,
            tempVal
        }}>
            {children}
        </ConnectionContext.Provider>
    );
};
