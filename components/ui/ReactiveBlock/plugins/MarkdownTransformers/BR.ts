import { TextMatchTransformer } from '@lexical/markdown';
import { $createLineBreakNode } from "lexical";

export const BR: TextMatchTransformer = {
    dependencies: [],
    export: () => null,
    importRegExp: /<br\/?>/,
    regExp: /<br\/?>/,
    replace: (textNode) => {
        textNode.replace($createLineBreakNode());
    },
    trigger: '<br/>',
    type: 'text-match',
};