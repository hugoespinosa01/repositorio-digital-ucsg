import React, { useState, useEffect } from "react"
import { Column, Getter, Table } from '@tanstack/react-table';
import { Row } from "@tanstack/react-table";
import { KardexDetalle } from "@/types/kardexDetalle";
import { Input } from "../ui/input";

declare module '@tanstack/react-table' {
    interface TableMeta<TData> {
        updateData: (rowIndex: number, columnId: string, value: string) => void;
    }

    interface ColumnMeta<TData, TValue> {
        type?: string;
    }
}

interface Props {
    getValue: Getter<string>;
    row: Row<KardexDetalle>;
    column: Column<KardexDetalle, unknown>;
    table: Table<KardexDetalle>;
}

export const TableCell = ({
    getValue,
    row,
    column,
    table
}: Props) => {

    const initialValue = getValue()
    const [value, setValue] = useState(initialValue)

    useEffect(() => {
        setValue(initialValue)
    }, [initialValue]);

    const onBlur = () => {
        table.options.meta?.updateData(row.index, column.id, value)
    }

    if (table.options.meta?.editedRows[row.id]) {
        return (
            <Input
                value={value}
                onChange={e => setValue(e.target.value)}
                onBlur={onBlur}
                type={column.columnDef.meta?.type || 'text'}
            />)
    }

    return <>{value}</>

}