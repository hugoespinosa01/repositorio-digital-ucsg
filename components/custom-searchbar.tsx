import { Input } from "@/components/ui/input";
import { Sparkles, LoaderCircle, Search } from "lucide-react";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useState, useEffect, FormEvent } from "react";

export default function SearchBar({
    handleSearch
}: {
    handleSearch: (query: string) => void;
}) {

    const [inputValue, setInputValue] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);

    useEffect(() => {
        if (inputValue) {
            setIsLoading(true);
            const timer = setTimeout(() => {
                setIsLoading(false);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [inputValue]);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        handleSearch(inputValue);
    }

    return (
        <div className="space-y-2">
            <div className="relative">
                <Input
                    id="input-19"
                    className="peer pe-9 ps-9"
                    placeholder="Busca un documento con IA"
                    type="search"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                />
                <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
                    {isLoading ? (
                        <LoaderCircle
                            className="animate-spin"
                            size={16}
                            strokeWidth={2}
                            aria-hidden="true"
                            role="presentation"
                        />
                    ) : (
                        <Search size={16} strokeWidth={2} aria-hidden="true" />
                    )}
                </div>

                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-lg border border-transparent text-muted-foreground/80 outline-offset-2 transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                                aria-label="Search"
                                onClick={handleSubmit}
                            >
                                <Sparkles size={16} strokeWidth={2} aria-hidden="true" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent>
                            Buscar con IA
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
        </div>
    );
}
