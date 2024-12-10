import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Edit } from "lucide-react";

export default function InputDemo({ value, label, noIcon }: { value: string | undefined, label: string, noIcon?: boolean }) {
    return (
        <div className="space-y-2">
            <Label htmlFor="input-20">{label}</Label>
            <div className="flex rounded-lg shadow-sm shadow-black/5">
                <Input
                    id="input-20"
                    className="-me-px w-full rounded-e-none shadow-none focus-visible:z-10"
                    type="text"
                    readOnly
                    value={value}
                />
                {
                    noIcon ? null : (<button
                        className="inline-flex w-9 items-center justify-center rounded-e-lg border border-input bg-background text-sm text-muted-foreground/80 outline-offset-2 transition-colors hover:bg-accent hover:text-accent-foreground focus:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="Edit"
                    >
                        <Edit size={16} strokeWidth={2} aria-hidden="true" />
                    </button>)
                }

            </div>

        </div>
    );
}