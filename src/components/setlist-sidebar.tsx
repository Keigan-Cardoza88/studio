
"use client";

import React, { useState } from 'react';
import { useAppContext } from '@/contexts/app-provider';
import { Sidebar, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Music, PlusCircle, Trash2 } from 'lucide-react';
import { useForm, SubmitHandler } from "react-hook-form";

type Inputs = {
  name: string;
};

export function SetlistSidebar() {
  const { setlists, addSetlist, activeSetlistId, setActiveSetlistId, deleteSetlist } = useAppContext();
  const [isNewSetlistOpen, setIsNewSetlistOpen] = useState(false);
  const { register, handleSubmit, reset } = useForm<Inputs>();

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
    </Sidebar>
  );
}

