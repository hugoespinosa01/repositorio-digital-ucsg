"use client";

import { Check, ChevronDown, Plus } from "lucide-react";
import { useState, useContext, useEffect } from "react";
import { FolderContext } from "@/context/folder-context";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Folder } from "@/types/folder";

// const folders = [
//   {
//     value: "originui",
//     label: "Origin UI",
//   },
//   {
//     value: "cruip",
//     label: "Cruip",
//   },
// ];

export default function SelectDemo() {
  const [open, setOpen] = useState<boolean>(false);
  const [value, setValue] = useState<string|null>(null);

  const { folders, fetchFolders } = useContext(FolderContext);

  useEffect(() => {
    fetchFolders(1, 10);
  }, [])

  console.log(folders);
  

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="select-42"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between bg-background px-3 font-normal outline-offset-0 hover:bg-background focus-visible:border-ring focus-visible:outline-[3px] focus-visible:outline-ring/20"
          >
            <span className={cn("truncate", !value && "text-muted-foreground")}>
              {value
                ? folders.find((organization) => organization.value === value)?.label
                : "Selecciona una carpeta"}
            </span>
            <ChevronDown
              size={16}
              strokeWidth={2}
              className="shrink-0 text-muted-foreground/80"              
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-full min-w-[var(--radix-popper-anchor-width)] border-input p-0"
          align="start"
        >
          <Command>
            <CommandInput placeholder="Busca una carpeta" />
            <CommandList>
              <CommandEmpty>No se encontraron carpetas</CommandEmpty>
              <CommandGroup>
                {folders.map((folder : Folder) => (
                  <CommandItem
                    key={folder.Id}
                    value={folder.Nombre}
                    onSelect={(currentValue) => {
                      setValue(currentValue === value ? "" : currentValue);
                      setOpen(false);
                    }}
                  >
                    {folder.Nombre}
                    {value === folder.Nombre && (
                      <Check size={16} strokeWidth={2} className="ml-auto" />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
