
"use client";

import React from 'react';
import { useAppContext } from '@/contexts/app-provider';
import { Sidebar, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Book, ChevronsUpDown, FolderPlus, MoreVertical, Music, PlusCircle, Trash2, Upload, Download, FilePenLine } from 'lucide-react';
import { useForm, SubmitHandler } from "react-hook-form";
import type { Setlist, Workbook } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Capacitor } from '@capacitor/core';
import type { Directory, Encoding } from '@capacitor/filesystem';


type Inputs = {
  name: string;
};

// Helper to convert blob to base64 data string
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      // The result includes the data URI prefix, so we need to remove it.
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',', 2)[1];
      if (base64) {
        resolve(base64);
      } else {
        reject(new Error("Failed to convert blob to Base64."));
      }
    };
    reader.readAsDataURL(blob);
  });
};


export function SetlistSidebar() {
  const { workbooks, addWorkbook, deleteWorkbook, updateWorkbook, moveSetlistToWorkbook, activeWorkbook, setActiveWorkbookId, addSetlist, activeSetlistId, setActiveSetlistId, deleteSetlist, importSetlists, activeWorkbookId } = useAppContext();
  const [isNewSetlistOpen, setIsNewSetlistOpen] = React.useState(false);
  const [isNewWorkbookOpen, setIsNewWorkbookOpen] = React.useState(false);
  const [isImportOpen, setIsImportOpen] = React.useState(false);
  const [workbookToImportTo, setWorkbookToImportTo] = React.useState<string | null>(null);
  const [isExportOpen, setIsExportOpen] = React.useState(false);
  const [exportFilename, setExportFilename] = React.useState('readysetplay_setlists.rsp');
  const [editingWorkbookId, setEditingWorkbookId] = React.useState<string | null>(null);
  const [editingWorkbookName, setEditingWorkbookName] = React.useState("");

  const { register, handleSubmit, reset } = useForm<Inputs>();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const onNewSetlistSubmit: SubmitHandler<Inputs> = (data) => {
    if (data.name.trim() && activeWorkbookId) {
      addSetlist(activeWorkbookId, data.name.trim());
      reset();
      setIsNewSetlistOpen(false);
    }
  };

  const onNewWorkbookSubmit: SubmitHandler<Inputs> = (data) => {
    if (data.name.trim()) {
      addWorkbook(data.name.trim());
      reset();
      setIsNewWorkbookOpen(false);
    }
  };
  
  const startEditingWorkbook = (workbook: Workbook) => {
    setEditingWorkbookId(workbook.id);
    setEditingWorkbookName(workbook.name);
  };

  const cancelEditingWorkbook = () => {
    setEditingWorkbookId(null);
    setEditingWorkbookName("");
  };

  const saveWorkbookName = () => {
    if (editingWorkbookId && editingWorkbookName.trim()) {
      updateWorkbook(editingWorkbookId, { name: editingWorkbookName.trim() });
      cancelEditingWorkbook();
    }
  };


  const handleDeleteSetlist = (e: React.MouseEvent, workbookId: string, setlistId: string) => {
    e.stopPropagation();
    deleteSetlist(workbookId, setlistId);
  }

  const handleExportSetlists = async () => {
    const setlistsToExport = activeWorkbook?.setlists || [];
    if (setlistsToExport.length === 0) {
        toast({
            title: "Nothing to Export",
            description: "This workbook has no setlists to export.",
            variant: "destructive",
        });
        return;
    }

    const finalFilename = exportFilename.trim().endsWith('.rsp') 
        ? exportFilename.trim() 
        : `${exportFilename.trim()}.rsp`;

    const dataStr = JSON.stringify(setlistsToExport, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    try {
      if (Capacitor.isNativePlatform()) {
        const { Share } = await import('@capacitor/share');
        const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
        
        const base64Data = await blobToBase64(dataBlob);

        const result = await Filesystem.writeFile({
          path: finalFilename,
          data: base64Data,
          directory: Directory.Cache,
          encoding: Encoding.UTF8
        });

        await Share.share({
          title: 'Exported Setlists',
          text: `Setlists from ${activeWorkbook?.name}`,
          dialogTitle: 'Share Setlists',
          url: result.uri,
        });

      } else {
        const fileToShare = new File([dataBlob], finalFilename, { type: 'application/json' });
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [fileToShare] })) {
          await navigator.share({
            files: [fileToShare],
            title: 'Exported Setlists',
            text: `Setlists from ${activeWorkbook?.name}`,
          });
        } else {
          // Fallback for desktop browsers: simulate a download
          const link = document.createElement('a');
          link.href = URL.createObjectURL(dataBlob);
          link.download = finalFilename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(link.href);
        }
      }
    } catch (error) {
        // Avoid showing error for user-cancelled share action
        const errorMessage = (error as Error)?.message || '';
        if ((error as DOMException)?.name !== 'AbortError' && !errorMessage.includes('canceled') && !errorMessage.includes('cancelled')) {
            toast({
                title: "Share Failed",
                description: "Could not share the file. Please try again.",
                variant: "destructive"
            });
        }
    }

    setIsExportOpen(false);
  };

  const handleImportClick = () => {
    if (!activeWorkbookId) {
       toast({ title: "No Workbook Selected", description: "Please select a workbook before importing.", variant: "destructive" });
       return;
    }
    setWorkbookToImportTo(activeWorkbookId);
    setIsImportOpen(true);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !workbookToImportTo) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') throw new Error("File is not valid text.");
        const importedData = JSON.parse(text);
        
        if (Array.isArray(importedData) && importedData.every(s => s.id && s.name && Array.isArray(s.songs))) {
          importSetlists(workbookToImportTo, importedData as Setlist[]);
        } else {
          throw new Error("Invalid .rsp file format.");
        }
      } catch (error) {
        toast({ title: "Import Failed", description: error instanceof Error ? error.message : "An unknown error occurred.", variant: "destructive" });
      } finally {
        if(fileInputRef.current) fileInputRef.current.value = '';
        setIsImportOpen(false);
        setWorkbookToImportTo(null);
      }
    };
    reader.onerror = () => toast({ title: "Import Failed", description: "Could not read the selected file.", variant: "destructive" });
    reader.readAsText(file);
  };
  
  const handleMoveSetlist = (setlistId: string, fromWorkbookId: string, toWorkbookId: string) => {
    if (fromWorkbookId === toWorkbookId) return;
    moveSetlistToWorkbook(setlistId, fromWorkbookId, toWorkbookId);
     toast({
      title: "Setlist Moved",
      description: `Successfully moved setlist to new workbook.`,
    });
  }

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
          <Dialog open={isNewWorkbookOpen} onOpenChange={setIsNewWorkbookOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  New Workbook
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Create New Workbook</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit(onNewWorkbookSubmit)}>
                  <Input {...register("name", { required: true })} placeholder="Workbook Name" className="my-4" />
                  <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                    <Button type="submit">Create</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          <Accordion type="multiple" className="w-full" value={activeWorkbookId ? [activeWorkbookId] : []} onValueChange={(value) => setActiveWorkbookId(value[value.length - 1] || null)}>
            {workbooks.map((workbook) => (
              <AccordionItem value={workbook.id} key={workbook.id} className="border-none">
                <div className="flex items-center group/workbook">
                  <AccordionTrigger className="flex-grow hover:no-underline rounded-md px-2 py-2">
                    <div className="flex items-center gap-2 w-full min-w-0">
                       <Music className="h-4 w-4 shrink-0 text-accent" /> 
                       {editingWorkbookId === workbook.id ? (
                          <div className="flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
                            <Input 
                              value={editingWorkbookName}
                              onChange={(e) => setEditingWorkbookName(e.target.value)}
                              onBlur={saveWorkbookName}
                              onKeyDown={(e) => e.key === 'Enter' && saveWorkbookName()}
                              autoFocus
                              className="h-7 w-full"
                            />
                          </div>
                       ) : (
                          <span className="truncate flex-1 text-left text-accent">{workbook.name}</span>
                       )}
                    </div>
                  </AccordionTrigger>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover/workbook:opacity-100">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                       <DropdownMenuItem onClick={() => startEditingWorkbook(workbook)}>
                          <FilePenLine className="mr-2 h-4 w-4" />
                          Rename
                        </DropdownMenuItem>
                       <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                                <span className="text-destructive">Delete</span>
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete "{workbook.name}"?</AlertDialogTitle>
                              <AlertDialogDescription>This will delete the workbook and all its setlists. This action cannot be undone.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteWorkbook(workbook.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <AccordionContent className="pt-1 pl-4">
                  <SidebarMenu>
                     <SidebarMenuItem>
                      <Dialog open={isNewSetlistOpen} onOpenChange={setIsNewSetlistOpen}>
                        <DialogTrigger asChild>
                           <Button variant="outline" size="sm" className="w-full justify-start h-8" disabled={activeWorkbookId !== workbook.id} onClick={() => setActiveWorkbookId(workbook.id)}>
                              <PlusCircle className="mr-2 h-4 w-4" /> New Setlist
                           </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>Create New Setlist</DialogTitle></DialogHeader>
                          <form onSubmit={handleSubmit(onNewSetlistSubmit)}>
                            <Input {...register("name", { required: true })} placeholder="Setlist Name" className="my-4" />
                            <DialogFooter>
                              <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                              <Button type="submit">Create</Button>
                            </DialogFooter>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </SidebarMenuItem>
                    {workbook.setlists.map((setlist) => (
                      <SidebarMenuItem key={setlist.id} className="group/item">
                        <SidebarMenuButton isActive={setlist.id === activeSetlistId} onClick={() => { setActiveWorkbookId(workbook.id); setActiveSetlistId(setlist.id);}} className="w-full">
                           <Book className="h-4 w-4 text-blue-400" />
                           <span className="truncate flex-grow text-left text-blue-400">{setlist.name}</span>
                        </SidebarMenuButton>
                        <div className="absolute right-1 top-1/2 -translate-y-1/2 h-7 flex items-center opacity-0 group-hover/item:opacity-100">
                           <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7"><ChevronsUpDown className="h-4 w-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                {workbooks.filter(w => w.id !== workbook.id).map(targetWorkbook => (
                                  <DropdownMenuItem key={targetWorkbook.id} onClick={() => handleMoveSetlist(setlist.id, workbook.id, targetWorkbook.id)}>
                                    Move to "{targetWorkbook.name}"
                                  </DropdownMenuItem>
                                ))}
                                {workbooks.length <= 1 && <DropdownMenuItem disabled>No other workbooks</DropdownMenuItem>}
                              </DropdownMenuContent>
                            </DropdownMenu>
                           <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>This will permanently delete the "{setlist.name}" setlist and all its songs.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={(e) => handleDeleteSetlist(e, workbook.id, setlist.id)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                        </div>
                      </SidebarMenuItem>
                    ))}
                    {workbook.setlists.length === 0 && <p className="text-xs text-muted-foreground px-3 py-2">No setlists yet.</p>}
                  </SidebarMenu>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </SidebarMenu>
      </SidebarContent>
       <SidebarMenu>
        <SidebarMenuItem>
          <Button variant="ghost" className="w-full justify-start" onClick={handleImportClick}>
            <Upload className="mr-2 h-4 w-4" />
            Import Setlists
          </Button>
          <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
             <DialogContent>
               <DialogHeader>
                 <DialogTitle>Import to Workbook</DialogTitle>
               </DialogHeader>
               <p className="text-muted-foreground">Select a workbook to import the setlists into.</p>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      {workbooks.find(w => w.id === workbookToImportTo)?.name || "Select a workbook"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
                    {workbooks.map(w => (
                      <DropdownMenuItem key={w.id} onSelect={() => setWorkbookToImportTo(w.id)}>
                        {w.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button onClick={() => fileInputRef.current?.click()} disabled={!workbookToImportTo}>Choose .rsp File</Button>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".rsp,application/json" className="hidden"/>
             </DialogContent>
          </Dialog>
        </SidebarMenuItem>
        <SidebarMenuItem>
           <Dialog open={isExportOpen} onOpenChange={setIsExportOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" className="w-full justify-start" onClick={() => setIsExportOpen(true)}>
                  <Download className="mr-2 h-4 w-4" />
                  Export Workbook
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Export "{activeWorkbook?.name}"</DialogTitle></DialogHeader>
                <div className="py-4">
                  <label htmlFor="filename" className="text-sm font-medium text-muted-foreground">Filename</label>
                  <Input id="filename" value={exportFilename} onChange={(e) => setExportFilename(e.target.value)} placeholder="e.g., my_setlists.rsp" className="mt-2" />
                </div>
                <DialogFooter>
                  <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                  <Button onClick={handleExportSetlists}>Save & Export</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
        </SidebarMenuItem>
      </SidebarMenu>
    </Sidebar>
  );
}

    