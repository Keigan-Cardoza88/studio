
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getSharedWorkbook } from '@/lib/share';
import { useAppContext } from '@/contexts/app-provider';
import type { Workbook } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Loader2, ShieldCheck, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function SharePage() {
    const router = useRouter();
    const params = useParams();
    const { shareId } = params;
    const { importSharedWorkbook, workbooks } = useAppContext();
    const { toast } = useToast();
    
    const [workbook, setWorkbook] = useState<Workbook | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (typeof shareId === 'string') {
            const fetchWorkbook = async () => {
                try {
                    setIsLoading(true);
                    const fetchedWorkbook = await getSharedWorkbook(shareId);
                    if (fetchedWorkbook) {
                        setWorkbook(fetchedWorkbook);
                    } else {
                        setError("This share link is invalid or has expired.");
                    }
                } catch (e) {
                    setError("Failed to fetch shared workbook.");
                    console.error(e);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchWorkbook();
        }
    }, [shareId]);

    const handleImport = () => {
        if (workbook) {
            const existing = workbooks.find(w => w.id === workbook.id);
            if (existing) {
                 toast({
                    title: "Workbook Already Exists",
                    description: `You already have "${workbook.name}". No need to import again.`,
                    variant: "default",
                });
            } else {
                importSharedWorkbook(workbook);
            }
            router.push('/');
        }
    };
    
    const handleCancel = () => {
        router.push('/');
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="h-12 w-12 animate-spin text-accent" />
            </div>
        );
    }
    
    if (error) {
         return (
            <div className="flex flex-col items-center justify-center h-screen p-4">
               <Card className="w-full max-w-md">
                   <CardHeader>
                       <CardTitle>Import Failed</CardTitle>
                   </CardHeader>
                   <CardContent>
                       <p className="text-destructive">{error}</p>
                   </CardContent>
                   <CardFooter>
                       <Button onClick={() => router.push('/')} className="w-full">Go to App</Button>
                   </CardFooter>
               </Card>
            </div>
        );
    }

    if (!workbook) {
        return null;
    }

    const existingWorkbook = workbooks.find(w => w.id === workbook.id);

    return (
        <div className="flex flex-col items-center justify-center h-screen p-4 bg-background">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto bg-accent/20 text-accent rounded-full h-16 w-16 flex items-center justify-center mb-4">
                        <Share2 className="h-8 w-8" />
                    </div>
                    <CardTitle className="text-2xl font-headline">Import Workbook</CardTitle>
                    <CardDescription>You've received a workbook from a friend.</CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                    <p className="text-xl font-semibold">{workbook.name}</p>
                    <p className="text-muted-foreground">{workbook.setlists.length} setlist(s)</p>
                    {existingWorkbook && (
                        <div className="flex items-center justify-center gap-2 text-sm text-green-500 bg-green-500/10 p-2 rounded-md">
                           <ShieldCheck className="h-4 w-4" />
                           <span>You already have this workbook.</span>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex flex-col sm:flex-row gap-2">
                    <Button variant="outline" onClick={handleCancel} className="w-full">Cancel</Button>
                    <Button onClick={handleImport} className="w-full">
                        {existingWorkbook ? 'Go to Workbook' : 'Import Now'}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
