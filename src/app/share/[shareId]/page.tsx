
"use client";

// This page is no longer used for sharing via link, 
// but is kept to prevent breaking old links.
// It can be removed in the future.

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

export default function DeprecatedSharePage() {
    const router = useRouter();

    useEffect(() => {
        // Redirect users to the main page after a short delay
        const timer = setTimeout(() => {
            router.push('/');
        }, 5000);

        return () => clearTimeout(timer);
    }, [router]);

    return (
        <div className="flex flex-col items-center justify-center h-screen p-4 bg-background">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                     <div className="mx-auto bg-destructive/20 text-destructive rounded-full h-16 w-16 flex items-center justify-center mb-4">
                        <AlertTriangle className="h-8 w-8" />
                    </div>
                    <CardTitle>Sharing Method Updated</CardTitle>
                    <CardDescription>
                        This sharing link is from a previous version of the app.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p>
                        The app now uses a copy-and-paste text method for sharing. Please ask your friend to generate a new share code from their app.
                    </p>
                    <p className="text-muted-foreground mt-4 text-sm">
                        You will be redirected to the homepage shortly.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
