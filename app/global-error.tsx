'use client' // Error components must be Client Components

import Button from "@/components/ui/common/Button";
import Link from "next/link";
import { useEffect } from 'react'

type ErrorProps = {
    error: Error;
    reset: () => void;
}

export default function GlobalError({error, reset}: ErrorProps) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error)
    }, [error])

    return (
        <div>
            <h2>Something went wrong!</h2>
            <Button style={{cursor: "pointer"}}
                    onClick={
                        // Attempt to recover by trying to re-render the segment
                        () => reset()
                    }
            >
                Try again
            </Button>
            <Link href="/" prefetch={false}>Go home</Link>
        </div>
    )
}