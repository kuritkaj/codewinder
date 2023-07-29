import { Database } from "@/lib/types/Database";

export type NotebookData = Database["public"]["Tables"]["notebooks"]["Row"];
export type StackData = Database["public"]["Tables"]["stacks"]["Row"];