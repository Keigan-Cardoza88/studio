
"use client";

import React from 'react';
import { useAppContext } from '@/contexts/app-provider';
import { Sidebar, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter } from '@/components/ui/sidebar';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Book, ChevronsUpDown, FolderPlus, MoreVertical, Music, PlusCircle, Trash2, Share, Clipboard, ClipboardCheck, FilePenLine, Merge, Loader2, Link } from 'lucide-react';
import { useForm, SubmitHandler } from "react-hook-form";
import type { Workbook, Setlist } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useLongPress } from '@/hooks/use-long-press';
import { cn } from '@/lib/utils';
import { shareWorkbook } from '@/lib/share';
import { useRouter } from 'next/navigation';


type Inputs = {
  name: string;
};

type MergeInputs = {
  name: string;
}

type ImportInputs = {
  url: string;
};

function ImportDialog() {
  const [isOpen, setIsOpen] = React.useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<ImportInputs>();
  const router = useRouter();
  const { toast } = useToast();

  const onSubmit: SubmitHandler<ImportInputs> = (data) => {
    try {
      const url = new URL(data.url);
      const pathSegments = url.pathname.split('/');
      const shareId = pathSegments[pathSegments.length - 1];

      if (pathSegments[pathSegments.length - 2] !== 'share' || !shareId) {
        throw new Error("Invalid share link format.");
      }
      
      router.push(`/share/${shareId}`);
      setIsOpen(false);

    } catch (e) {
      console.error(e);
      toast({
        title: "Invalid Link",
        description: "Please paste a valid workbook share link.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="w-full justify-start">
          <Link className="mr-2 h-4 w-4" />
          Import from Link
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Workbook from Link</DialogTitle>
          <DialogDescription>
            Paste the share link you received to import the workbook.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="py-4">
             <Input 
                {...register("url", { required: "A share link is required." })} 
                placeholder="https://..." 
                className="my-4" 
             />
             {errors.url && <p className="text-sm text-destructive">{errors.url.message}</p>}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">Cancel</Button>
            </DialogClose>
            <Button type="submit">Import</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function MergeSetlistsDialog() {
  const { activeWorkbookId, selectedSetlistIds, mergeSetlists, clearSetlistSelection } = useAppContext();
  const [isOpen, setIsOpen] = React.useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<MergeInputs>();

  const onSubmit: SubmitHandler<MergeInputs> = (data) => {
    if (activeWorkbookId && data.name.trim()) {
      mergeSetlists(activeWorkbookId, selectedSetlistIds, data.name.trim());
      reset();
      setIsOpen(false);
    }
  };

  React.useEffect(() => {
    if(selectedSetlistIds.length < 2) {
      setIsOpen(false);
    }
  }, [selectedSetlistIds]);
  
  if (selectedSetlistIds.length < 2 || !activeWorkbookId) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
          reset();
          clearSetlistSelection();
        }
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          <Merge className="mr-2 h-4 w-4" />
          Merge Selected ({selectedSetlistIds.length})
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Merge Setlists</DialogTitle>
          <DialogDescription>
            Create a new setlist containing all songs from the selected setlists.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="py-4">
             <Input 
                {...register("name", { required: "A name is required for the new setlist." })} 
                placeholder="New Merged Setlist Name" 
                className="my-4" 
             />
             {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">Cancel</Button>
            </DialogClose>
            <Button type="submit">Merge</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


export function SetlistSidebar() {
  const { 
    workbooks, addWorkbook, deleteWorkbook, updateWorkbook, moveSetlistToWorkbook, 
    activeWorkbook, setActiveWorkbookId, addSetlist, updateSetlist, activeSetlistId, setActiveSetlistId, 
    deleteSetlist, activeWorkbookId, 
    selectedSetlistIds, handleSetlistSelectionChange, isSetlistSelectionModeActive, setIsSetlistSelectionModeActive,
    clearSetlistSelection,
  } = useAppContext();
  const [isNewSetlistOpen, setIsNewSetlistOpen] = React.useState(false);
  const [isNewWorkbookOpen, setIsNewWorkbookOpen] = React.useState(false);
  const [isShareOpen, setIsShareOpen] = React.useState(false);
  const [editingWorkbookId, setEditingWorkbookId] = React.useState<string | null>(null);
  const [editingWorkbookName, setEditingWorkbookName] = React.useState("");
  const [editingSetlistId, setEditingSetlistId] = React.useState<string | null>(null);
  const [editingSetlistName, setEditingSetlistName] = React.useState("");
  const [hasCopied, setHasCopied] = React.useState(false);
  const [shareUrl, setShareUrl] = React.useState('');
  const [isSharing, setIsSharing] = React.useState(false);


  const { register, handleSubmit, reset } = useForm<Inputs>();
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
    }
    cancelEditingWorkbook();
  };

  const startEditingSetlist = (setlist: Setlist) => {
    setEditingSetlistId(setlist.id);
    setEditingSetlistName(setlist.name);
  };

  const cancelEditingSetlist = () => {
    setEditingSetlistId(null);
    setEditingSetlistName("");
  };

  const saveSetlistName = (workbookId: string) => {
    if (editingSetlistId && editingSetlistName.trim()) {
      updateSetlist(workbookId, editingSetlistId, { name: editingSetlistName.trim() });
    }
    cancelEditingSetlist();
  };


  const handleDeleteSetlist = (e: React.MouseEvent, workbookId: string, setlistId: string) => {
    e.stopPropagation();
    deleteSetlist(workbookId, setlistId);
  }

  const handleShareClick = () => {
     if (!activeWorkbook) {
       toast({ title: "No Workbook Selected", description: "Please select a workbook to share.", variant: "destructive" });
       return;
    }
    setIsShareOpen(true);
  }

  const generateShareLink = React.useCallback(async () => {
    if (!activeWorkbook) return;

    setIsSharing(true);
    setShareUrl('');
    console.log("DEBUG: generateShareLink started.");

    try {
      console.log("DEBUG: Sharing workbook:", activeWorkbook);
      const id = await shareWorkbook(activeWorkbook);
      const url = `${window.location.origin}/share/${id}`;
      console.log("DEBUG: Share link generated:", { id, url });
      setShareUrl(url);
    } catch (e) {
      console.error("DEBUG: Sharing failed with error:", e);
      toast({ title: "Sharing Failed", description: "Could not generate share link. Please try again.", variant: "destructive" });
      setIsShareOpen(false); 
      setIsSharing(false);
    } finally {
        setIsSharing(false);
        console.log("DEBUG: generateShareLink finished.");
    }
  }, [activeWorkbook, toast]);

  React.useEffect(() => {
    if (isShareOpen) {
        generateShareLink();
    }
  }, [isShareOpen, generateShareLink]);

  const handleCopyToClipboard = () => {
    if(!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).then(() => {
        setHasCopied(true);
        toast({ title: "Copied to clipboard!" });
        setTimeout(() => setHasCopied(false), 2000);
    }, () => {
        toast({ title: "Failed to copy", variant: "destructive" });
    });
  }

  const handleMoveSetlist = (setlistId: string, fromWorkbookId: string, toWorkbookId: string) => {
    if (fromWorkbookId === toWorkbookId) return;
    moveSetlistToWorkbook(setlistId, fromWorkbookId, toWorkbookId);
     toast({
      title: "Setlist Moved",
      description: `Successfully moved setlist to new workbook.`,
    });
  }
  
  const longPressEvents = useLongPress({
    onLongPress: (e, target) => {
        if (!target) return;
        const setlistId = target.dataset.setlistId;
        if (setlistId && !isSetlistSelectionModeActive) {
            setIsSetlistSelectionModeActive(true);
            handleSetlistSelectionChange(setlistId, true);
        }
    },
    onClick: (e, target) => {
        if (!target) return;
        const setlistId = target.dataset.setlistId;
        const workbookId = target.dataset.workbookId;
        if (!setlistId || !workbookId) return;

        if (isSetlistSelectionModeActive) {
            handleSetlistSelectionChange(setlistId, !selectedSetlistIds.includes(setlistId));
        } else {
            setActiveWorkbookId(workbookId);
            setActiveSetlistId(setlistId);
        }
    }
  });


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
                  <FolderPlus className="mr-2 h-4 w-4" />
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
                          <div className="flex-1 min-w-0" onClick={(e) => e.preventDefault()}>
                            <Input 
                              value={editingWorkbookName}
                              onChange={(e) => setEditingWorkbookName(e.target.value)}
                              onBlur={saveWorkbookName}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveWorkbookName();
                                if (e.key === 'Escape') cancelEditingWorkbook();
                              }}
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
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Delete</span>
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
                           <Button variant="outline" size="sm" className="w-full justify-start h-8" disabled={activeWorkbookId !== workbook.id || isSetlistSelectionModeActive} onClick={() => setActiveWorkbookId(workbook.id)}>
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
                      <SidebarMenuItem key={setlist.id} className="group/item flex items-center gap-2">
                        <div 
                          className="flex-grow flex items-center min-w-0"
                          {...longPressEvents} 
                          data-setlist-id={setlist.id}
                          data-workbook-id={workbook.id}
                        >
                            { isSetlistSelectionModeActive && activeWorkbookId === workbook.id && <Checkbox 
                                id={`select-setlist-${setlist.id}`}
                                checked={selectedSetlistIds.includes(setlist.id)}
                                onCheckedChange={(checked) => handleSetlistSelectionChange(setlist.id, Boolean(checked))}
                                className="ml-2"
                            /> }
                             {editingSetlistId === setlist.id ? (
                                <div className="flex-1 min-w-0 py-1" onClick={(e) => e.stopPropagation()}>
                                  <Input
                                    value={editingSetlistName}
                                    onChange={(e) => setEditingSetlistName(e.target.value)}
                                    onBlur={() => saveSetlistName(workbook.id)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') saveSetlistName(workbook.id);
                                      if (e.key === 'Escape') cancelEditingSetlist();
                                    }}
                                    autoFocus
                                    className="h-8 w-full"
                                  />
                                </div>
                              ) : (
                                <SidebarMenuButton 
                                    isActive={setlist.id === activeSetlistId && !isSetlistSelectionModeActive} 
                                    className={cn("w-full cursor-pointer", isSetlistSelectionModeActive && "cursor-default")}
                                    disabled={isSetlistSelectionModeActive && activeWorkbookId !== workbook.id}
                                >
                                  <Book className="h-4 w-4 shrink-0 text-blue-400" />
                                  <span className="truncate flex-grow text-left text-blue-400">{setlist.name}</span>
                                </SidebarMenuButton>
                              )}
                        </div>
                        <div className="absolute right-1 top-1/2 -translate-y-1/2 h-7 flex items-center opacity-0 group-hover/item:opacity-100 group-focus-within/item:opacity-100">
                           <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7" disabled={isSetlistSelectionModeActive}><ChevronsUpDown className="h-4 w-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => startEditingSetlist(setlist)}>
                                  <FilePenLine className="mr-2 h-4 w-4" />
                                  Rename
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {workbooks.filter(w => w.id !== workbook.id).map(targetWorkbook => (
                                  <DropdownMenuItem key={targetWorkbook.id} onClick={() => handleMoveSetlist(setlist.id, workbook.id, targetWorkbook.id)}>
                                    Move to "{targetWorkbook.name}"
                                  </DropdownMenuItem>
                                ))}
                                {workbooks.length <= 1 && <DropdownMenuItem disabled>No other workbooks</DropdownMenuItem>}
                                <DropdownMenuSeparator />
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      <span>Delete</span>
                                    </DropdownMenuItem>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete "{setlist.name}"?</AlertDialogTitle>
                                      <AlertDialogDescription>This will permanently delete the setlist and all its songs.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={(e) => handleDeleteSetlist(e, workbook.id, setlist.id)}>Delete</AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </DropdownMenuContent>
                            </DropdownMenu>
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
       <SidebarFooter>
        <SidebarMenu>
            {isSetlistSelectionModeActive && selectedSetlistIds.length > 1 && (
                <SidebarMenuItem>
                    <MergeSetlistsDialog />
                </SidebarMenuItem>
            )}
            {isSetlistSelectionModeActive && selectedSetlistIds.length > 0 && (
                <SidebarMenuItem>
                     <Button variant="ghost" className="w-full justify-start" onClick={() => {
                       clearSetlistSelection();
                       setIsSetlistSelectionModeActive(false);
                     }}>
                        Cancel Selection
                    </Button>
                </SidebarMenuItem>
            )}
            <SidebarMenuItem>
              <ImportDialog />
            </SidebarMenuItem>
            <SidebarMenuItem>
               <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" className="w-full justify-start" onClick={handleShareClick} disabled={!activeWorkbook}>
                      <Share className="mr-2 h-4 w-4" />
                      Share Workbook
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Share "{activeWorkbook?.name}"</DialogTitle>
                        <DialogDescription>
                            Copy the link below and send it to your friends. They can open it to import the workbook.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="relative py-4">
                      {isSharing ? (
                        <div className="flex items-center justify-center h-24">
                          <Loader2 className="h-8 w-8 animate-spin text-accent" />
                        </div>
                      ) : (
                        <Input 
                          readOnly 
                          value={shareUrl} 
                          className="font-mono"
                         />
                      )}
                    </div>
                    <DialogFooter>
                      <DialogClose asChild><Button type="button" variant="secondary">Done</Button></DialogClose>
                      <Button onClick={handleCopyToClipboard} disabled={isSharing || !shareUrl}>
                        {hasCopied ? <ClipboardCheck className="mr-2 h-4 w-4" /> : <Clipboard className="mr-2 h-4 w-4" />}
                        {hasCopied ? "Copied!" : "Copy Link"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
            </SidebarMenuItem>
        </SidebarMenu>
       </SidebarFooter>
    </Sidebar>
  );
}
