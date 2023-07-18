export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            code: {
                Row: {
                    content: string | null
                    embedding: string | null
                    id: number
                    metadata: Json | null
                }
                Insert: {
                    content?: string | null
                    embedding?: string | null
                    id?: number
                    metadata?: Json | null
                }
                Update: {
                    content?: string | null
                    embedding?: string | null
                    id?: number
                    metadata?: Json | null
                }
                Relationships: []
            }
            knowledge: {
                Row: {
                    content: string | null
                    embedding: string | null
                    id: number
                    metadata: Json | null
                }
                Insert: {
                    content?: string | null
                    embedding?: string | null
                    id?: number
                    metadata?: Json | null
                }
                Update: {
                    content?: string | null
                    embedding?: string | null
                    id?: number
                    metadata?: Json | null
                }
                Relationships: []
            }
            memories: {
                Row: {
                    content: string | null
                    embedding: string | null
                    id: number
                    metadata: Json | null
                }
                Insert: {
                    content?: string | null
                    embedding?: string | null
                    id?: number
                    metadata?: Json | null
                }
                Update: {
                    content?: string | null
                    embedding?: string | null
                    id?: number
                    metadata?: Json | null
                }
                Relationships: []
            }
            notes: {
                Row: {
                    content: Json | null
                    created_at: string | null
                    id: number
                    owner_id: number | null
                    updated_at: string | null
                }
                Insert: {
                    content?: Json | null
                    created_at?: string | null
                    id?: number
                    owner_id?: number | null
                    updated_at?: string | null
                }
                Update: {
                    content?: Json | null
                    created_at?: string | null
                    id?: number
                    owner_id?: number | null
                    updated_at?: string | null
                }
                Relationships: []
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            ivfflathandler: {
                Args: {
                    "": unknown
                }
                Returns: unknown
            }
            match_code: {
                Args: {
                    query_embedding: string
                    match_count: number
                }
                Returns: {
                    id: number
                    content: string
                    metadata: Json
                    similarity: number
                }[]
            }
            match_knowledge: {
                Args: {
                    query_embedding: string
                    match_count: number
                }
                Returns: {
                    id: number
                    content: string
                    metadata: Json
                    similarity: number
                }[]
            }
            match_memories: {
                Args: {
                    query_embedding: string
                    match_count: number
                }
                Returns: {
                    id: number
                    content: string
                    metadata: Json
                    similarity: number
                }[]
            }
            vector_avg: {
                Args: {
                    "": number[]
                }
                Returns: string
            }
            vector_dims: {
                Args: {
                    "": string
                }
                Returns: number
            }
            vector_norm: {
                Args: {
                    "": string
                }
                Returns: number
            }
            vector_out: {
                Args: {
                    "": string
                }
                Returns: unknown
            }
            vector_send: {
                Args: {
                    "": string
                }
                Returns: string
            }
            vector_typmod_in: {
                Args: {
                    "": unknown[]
                }
                Returns: number
            }
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}