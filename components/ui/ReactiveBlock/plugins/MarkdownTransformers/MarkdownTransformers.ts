import { BR } from "@/components/ui/ReactiveBlock/plugins/MarkdownTransformers/BR";
import { DETAILS } from "@/components/ui/ReactiveBlock/plugins/MarkdownTransformers/DETAILS";
import { EMOJI } from "@/components/ui/ReactiveBlock/plugins/MarkdownTransformers/EMOJI";
import { HR } from "@/components/ui/ReactiveBlock/plugins/MarkdownTransformers/HR";
import { TABLE } from "@/components/ui/ReactiveBlock/plugins/MarkdownTransformers/TABLE";
import { CHECK_LIST, ELEMENT_TRANSFORMERS, TEXT_FORMAT_TRANSFORMERS, TEXT_MATCH_TRANSFORMERS, Transformer } from '@lexical/markdown';

export const REACTIVE_NOTEBOOK_TRANSFORMERS: Array<Transformer> = [
    ...ELEMENT_TRANSFORMERS,
    ...TEXT_FORMAT_TRANSFORMERS,
    ...TEXT_MATCH_TRANSFORMERS,
    BR,
    CHECK_LIST,
    DETAILS,
    EMOJI,
    HR,
    TABLE,
];
