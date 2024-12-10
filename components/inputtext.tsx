import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit, Save } from "lucide-react";
import { useState } from "react";
import EditKardexFieldModal from "./modals/edit-kardex-fields";

export default function InputDemo({ value, label, noIcon }: { value: string | undefined, label: string, noIcon?: boolean }) {

    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [fieldValue, setFieldValue] = useState<string | undefined>(value);
    const [openModal, setOpenModal] = useState<boolean>(false);

    const handleClick = () => {
        setIsEditing(!isEditing);

        if (isEditing) {
            console.log("Save");
            setOpenModal(true);
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFieldValue(e.target.value);
    }

    const handleAccept = async () => {
        setIsEditing(false);

        const response = await fetch('/api/files/', {
            method: 'PUT',
            headers: {
                'Authorization': 'Bearer ',
                'Content-Type': 'application/json',
            },
        })

        if (!response.ok) {
            throw new Error(`Error al obtener el archivo: ${response.statusText}`);
        }

        const res = await response.json();
        console.log(res);

        setOpenModal(false);
    }

    return (
        <div className="space-y-2">
            <EditKardexFieldModal
                openModal={openModal}
                setOpenModal={setOpenModal}
                handleAccept={handleAccept}
            />
            <Label htmlFor="input-20">{label}</Label>
            <div className="flex rounded-lg shadow-sm shadow-black/5">
                <Input
                    id="input-20"
                    className="-me-px w-full rounded-e-none shadow-none focus-visible:z-10"
                    type="text"
                    readOnly={!isEditing}
                    value={fieldValue || ""}
                    onChange={handleChange}
                />
                {
                    noIcon ? null : (
                        <button
                            className="inline-flex w-9 items-center justify-center rounded-e-lg border border-input bg-background text-sm text-muted-foreground/80 outline-offset-2 transition-colors hover:bg-accent hover:text-accent-foreground focus:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                            aria-label="Edit"
                            onClick={handleClick}
                        >


                            {
                                isEditing ? (
                                    <Save size={16} strokeWidth={2} aria-hidden="true" />
                                ) :
                                    <Edit size={16} strokeWidth={2} aria-hidden="true" />
                            }
                        </button>)
                }

            </div>

        </div>
    );
}