import React, { createContext, ReactNode } from "react";

interface NamespaceContextProps {
    namespace: string;
}

const NamespaceContext = createContext<NamespaceContextProps>("");

type Props = {
    children: ReactNode;
    namespace: string;
}

export const NamespaceProvider = ({children, namespace}: Props) => {
    return (
        <NamespaceContext.Provider value={{namespace}}>
            {children}
        </NamespaceContext.Provider>
    );
};

export default NamespaceContext;