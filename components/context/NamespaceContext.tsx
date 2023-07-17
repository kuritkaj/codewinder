import React, { createContext, ReactNode } from "react";

interface NamespaceContextProps {
    namespace: string;
}

const defaultNamespace = {
    namespace: "default",
}

const NamespaceContext = createContext<NamespaceContextProps>(defaultNamespace);

type NamespaceProviderProps = {
    children: ReactNode;
    namespace: string;
}

export const NamespaceProvider = ({children, namespace}: NamespaceProviderProps) => {
    return (
        <NamespaceContext.Provider value={{namespace}}>
            {children}
        </NamespaceContext.Provider>
    );
};

export default NamespaceContext;