'use client';

import { useMemo } from 'react';
import { SingleValue } from 'react-select';
import AsyncSelect from 'react-select/async';
import makeAnimated from 'react-select/animated';
import { Folder } from '@/types/folder';

type Props = {
    onChange: (value?: string) => void;
    value?: string | null | undefined;
    disabled?: boolean;
    placeholder?: string;
}

export const CustomSelect = ({
    value,
    onChange,
    disabled,
    placeholder
}: Props) => {

    const onSelect = (newValue: SingleValue<{ label: string, value: string }>)=> {
        const option = newValue as SingleValue<{ label: string, value: string }>;
        onChange(option?.value);
    }

    // const formattedValue = useMemo(() => {
    //     return options.find((option) => option.value === value);
    // }, [options, value]);

    interface Option {
        label: string;
        value: string;
    }

    const loadOptions = async (searchValue: string): Promise<Option[]> => {
        const res = await fetch('/api/folders?query=' + searchValue);
        const data = await res.json();
        return data.data.map((folder: Folder) => ({ label: folder.Nombre, value: folder.Id.toString() }));
    }

    return (
        <AsyncSelect
            closeMenuOnSelect={false}
            components={makeAnimated()}
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
            loadOptions={loadOptions}
            // options={options}
            isDisabled={disabled}
        />
    )
}