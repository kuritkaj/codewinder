import { MessageType } from "@/lib/types/MessageType";

export type BlockData = {
    editable?: boolean;
    markdown: string;
    namespace: string;
    type: MessageType;
}

export type PartialBlockData = {
    markdown: string;
    namespace: string;
}