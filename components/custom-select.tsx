'use client';
import { SingleValue } from 'react-select';
import AsyncSelect from 'react-select/async';
import { Folder } from '@/types/folder';
import debounce from "debounce-promise";

type Props = {
    onChange: (value?: string) => void;
    disabled?: boolean;
    placeholder?: string;
    idFolder?: number;
    idFile?: number;
}

export const CustomSelect = ({
    onChange,
    disabled,
    placeholder,
    idFolder,
    idFile
}: Props) => {

    const onSelect = (newValue: SingleValue<{ label: string, value: string }>) => {
        const option = newValue as SingleValue<{ label: string, value: string }>;
        onChange(option?.value);
    }

    interface Option {
        label: string;
        value: string;
    }

    const loadOptions = debounce(async (searchValue: string): Promise<Option[]> => {
        let res = null;
        if (idFolder) {
            res = await fetch(`/api/folders?id=${idFolder}&query=${searchValue}`);
        } else {
            res = await fetch(`/api/folders?query=${searchValue}`);
        }
        const data = await res.json();
        return data.data.map((folder: Folder) => ({ label: folder.Nombre, value: folder.Id.toString() }));

    }, 300);

    return (
        <AsyncSelect
            placeholder={placeholder}
            className="w-full text-sm h-10"
            styles={{
                input: (base) => ({
                    ...base,
                    ":active": {
                        borderColor: '#ba4665'
                    }
                }),
                control: (base) => ({
                    ...base,
                    borderColor: '#ba4665',
                    backgroundColor: 'transparent',

                    ":hover": {
                        borderColor: '#ba4665',
                    },
                    ":focus": {
                        borderColor: '#ba4665',
                    },
                    ":active": {
                        borderColor: '#ba4665',
                    }
                }),
                option: (base) => (
                    {
                        ...base,
                        ":active": {
                            backgroundColor: '#ba4665',
                            borderColor: '#ba4665',
                            color: 'white'

                        },
                        ":hover": {
                            backgroundColor: '#d4c9cc',
                        }
                    }
                )
            }}
            // value={formattedValue}
            onChange={(newValue) => {
                const selectedOption = newValue as SingleValue<{ label: string, value: string }>;
                onSelect(selectedOption);
            }}
            defaultOptions
            cacheOptions
            loadOptions={loadOptions}
            // options={options}
            isDisabled={disabled}
        />
    )
}