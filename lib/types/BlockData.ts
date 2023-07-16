import { MessageType } from "@/lib/types/MessageType";

export interface BlockData {
    editable: boolean;
    markdown: string;
    namespace: string;
    type: MessageType;
}

export interface PartialBlockData {
    markdown: string;
    namespace: string;
}