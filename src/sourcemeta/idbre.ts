export interface Idbre {
    table: Itable[]
}


export interface Itable {
    name: string,
    column : Icolumn[],
    foreignKey?: IforeignKey[],
    unique?: Iunique,
    index?: Iindex[]
}


export interface Icolumn {
    name: string,
    primaryKey: boolean,
    required: boolean,
    scale: number,
    size: number,
    type: string
}

export interface IforeignKey {
    foreignTable: string,
    name: string,
    onDelete: string,
    onUpdate: string,
    option: Ioption[],
    reference: Ireference
}

export interface Ioption {
    key: string,
    value: any
}

export interface Ireference {
    foreign: string,
    local: string
}

export interface Iunique {
    name?: string,
    uniqueColumn: IuniqueColumn
}

export interface IuniqueColumn {
    name: string
}

export interface Iindex {
    name: string,
    indexColumn: IindexColumn
}

export interface IindexColumn {
    name: string
}

