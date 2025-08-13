
"use client";

import React, { useState, useRef } from 'react';
import { useAppContext } from '@/contexts/app-provider';
import { Sidebar, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Music, PlusCircle, Trash2, Upload, Download } from 'lucide-react';
import { useForm, SubmitHandler } from "react-hook-form";
import type { Setlist } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

type Inputs = {
  name: string;
};

export function SetlistSidebar() {
  const { setlists, addSetlist, activeSetlistId, setActiveSetlistId, deleteSetlist, importSetlists } = useAppContext();
  const [isNewSetlistOpen, setIsNewSetlistOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportFilename, setExportFilename] = useState('readysetplay_setlists.rsp');

  const { register, handleSubmit, reset } = useForm<Inputs>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const onSubmit: SubmitHandler<Inputs> = (data) => {
    if (data.name.trim()) {
      addSetlist(data.name.trim());
      reset();
      setIsNewSetlistOpen(false);
    }
  };

  const handleDeleteSetlist = (e: React.MouseEvent, setlistId: string) => {
    e.stopPropagation();
    deleteSetlist(setlistId);
  }

  const handleExportSetlists = async () => {
    if (setlists.length === 0) {
      toast({
        title: "Nothing to Export",
        description: "You don't have any setlists to export.",
        variant: "destructive",
      });
      return;
    }

    const finalFilename = exportFilename.trim().endsWith('.rsp') 
        ? exportFilename.trim() 
        : `${exportFilename.trim()}.rsp`;

    const dataStr = JSON.stringify(setlists, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const fileToShare = new File([dataBlob], finalFilename, { type: 'application/json' });

    // Use Web Share API if available
    if (navigator.canShare && navigator.canShare({ files: [fileToShare] })) {
      try {
        await navigator.share({
          files: [fileToShare],
          title: 'Exported Setlists',
          text: `Here are the setlists from ReadySetPlay: ${finalFilename}`,
        });
        toast({
          title: "Share initiated",
          description: "Your setlists are ready to be shared.",
        });
      } catch (error) {
        // This can happen if the user cancels the share dialog
        console.info('Share was cancelled or failed', error);
        if ((error as DOMException)?.name !== 'AbortError') {
            toast({
            title: "Share Failed",
            description: "An unexpected error occurred during sharing.",
            variant: "destructive"
            });
        }
      }
    } else {
        toast({
            title: "Feature Not Supported",
            description: "Sharing is not supported on this device or browser.",
            variant: "destructive",
        });
    }

    setIsExportOpen(false);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') throw new Error("File is not valid text.");
        const importedData = JSON.parse(text);
        
        // Basic validation
        if (Array.isArray(importedData) && importedData.every(s => s.id && s.name && Array.isArray(s.songs))) {
          importSetlists(importedData as Setlist[]);
          toast({
            title: "Import Successful",
            description: "Setlists have been imported.",
          });
        } else {
          throw new Error("Invalid .rsp file format.");
        }
      } catch (error) {
        toast({
          title: "Import Failed",
          description: error instanceof Error ? error.message : "An unknown error occurred.",
          variant: "destructive",
        });
      } finally {
        // Reset file input
        if(fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.onerror = () => {
       toast({
          title: "Import Failed",
          description: "Could not read the selected file.",
          variant: "destructive",
        });
    };
    reader.readAsText(file);
  };


  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2">
            <Music className="w-8 h-8 text-accent" />
            <h1 className="text-2xl font-headline font-bold">ReadySetPlay</h1>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
           <SidebarMenuItem>
            <Dialog open={isNewSetlistOpen} onOpenChange={setIsNewSetlistOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" className="w-full justify-start">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  New Setlist
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Setlist</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                  <Input {...register("name", { required: true })} placeholder="Setlist Name" className="my-4" />
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="secondary">Cancel</Button>
                    </DialogClose>
                    <Button type="submit">Create</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </SidebarMenuItem>
          {setlists.map((setlist) => (
            <SidebarMenuItem key={setlist.id} className="group/item">
              <SidebarMenuButton
                isActive={setlist.id === activeSetlistId}
                onClick={() => setActiveSetlistId(setlist.id)}
                className="w-full"
              >
                <span className="truncate flex-grow text-left">{setlist.name}</span>
              </SidebarMenuButton>
               <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 opacity-0 group-hover/item:opacity-100">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the "{setlist.name}" setlist and all its songs.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={(e) => handleDeleteSetlist(e, setlist.id)}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
       <SidebarMenu>
        <SidebarMenuItem>
          <Button variant="ghost" className="w-full justify-start" onClick={handleImportClick}>
            <Upload className="mr-2 h-4 w-4" />
            Import Setlist
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".rsp,application/json"
            className="hidden"
          />
        </SidebarMenuItem>
        <SidebarMenuItem>
           <Dialog open={isExportOpen} onOpenChange={setIsExportOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" className="w-full justify-start" onClick={() => setIsExportOpen(true)}>
                  <Download className="mr-2 h-4 w-4" />
                  Export All
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Export Setlists</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <label htmlFor="filename" className="text-sm font-medium text-muted-foreground">Filename</label>
                  <Input 
                    id="filename" 
                    value={exportFilename}
                    onChange={(e) => setExportFilename(e.target.value)}
                    placeholder="e.g., my_setlists.rsp"
                    className="mt-2"
                  />
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="secondary">Cancel</Button>
                  </DialogClose>
                  <Button onClick={handleExportSetlists}>Save & Export</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
        </SidebarMenuItem>
      </SidebarMenu>
    </Sidebar>
  );
}
