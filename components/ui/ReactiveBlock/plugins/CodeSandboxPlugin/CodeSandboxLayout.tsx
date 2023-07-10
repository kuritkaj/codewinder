import { useSandpack } from "@codesandbox/sandpack-react";
import { forwardRef, ForwardRefRenderFunction } from "react";
import * as React from "react";
import styles from "./CodeSandboxLayout.module.css";

// Source: https://github.com/codesandbox/sandpack/blob/main/sandpack-react/src/components/CodeEditor/utils.ts
export const useCombinedRefs = <T extends any>(
    ...refs: Array<React.Ref<T>>
): React.Ref<T> =>
    React.useCallback((element: T) =>
        refs.forEach((ref) => {
            if (!ref) {
                return;
            }

            // Ref can have two types - a function or an object. We treat each case.
            if (typeof ref === "function") {
                return ref(element);
            }

            // As per https://github.com/facebook/react/issues/13029
            // it should be fine to set current this way.
            (ref as any).current = element;
        }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [refs]
    );

export interface CodeSandboxLayoutProps extends React.HtmlHTMLAttributes<unknown> {
    children?: React.ReactNode;
}

const CodeSandboxLayout: ForwardRefRenderFunction<HTMLDivElement, CodeSandboxLayoutProps> = ((props, forwardedRef) => {
    const {children, ...otherProps} = props;
    const {sandpack} = useSandpack();
    const combinedRef = useCombinedRefs(sandpack.lazyAnchorRef, forwardedRef);

    return (
        <div ref={combinedRef} className={styles.layout} {...otherProps}>
            {children}
        </div>
    );
});

export default forwardRef(CodeSandboxLayout);
