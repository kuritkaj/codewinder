import { useSandpack } from "@codesandbox/sandpack-react";
import * as React from "react";

export interface CodeSandboxLayoutProps extends React.HtmlHTMLAttributes<unknown> {
    children?: React.ReactNode;
}

export const CodeSandboxLayout = (({children, className, ...props}) => {
    const {sandpack} = useSandpack();

    return (
        <div
            ref={sandpack.lazyAnchorRef}
            className={className}
            {...props}
        >
            {children}
        </div>
    );
});

export default React.forwardRef<
    HTMLDivElement,
    CodeSandboxLayoutProps
>(CodeSandboxLayout);