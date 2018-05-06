
import { domainmodels } from 'mendixmodelsdk';

import {Icolumn, Idbre, Itable} from '../sourcemeta/idbre';

/* *********************************************************
   Used to expedite trials with models smaller than the whole 120 entities and over 3000 attributes.
   If > 0 then it is the max # of entities to be created
*/
const LIMITRUN = true;
const MAXENTITIES   = LIMITRUN ? 50 : 0;
const MAXATTRIBUTES = LIMITRUN ? 10 : 0;


const XCURSOR_INITIAL = 100;
const XCURSOR_SPACE = 150;
const YCURSOR_INITIAL = 100;
const YCURSOR_ENTITY = 20;
const YCURSOR_ATTRIBUTE = 14;
const YCURSOR_SPACE = 20;
const YCURSOR_MAX = 1201;

export default function populateMendixFromDBRE( theMendixDomainModel : domainmodels.DomainModel, theDBRE : Idbre) {

    console.info( "HI!");

    const somePrioritisedTableColumns = new Map<string, string[]>();

    const someTables = chooseAFewTables( theDBRE, somePrioritisedTableColumns);
    let aNumTables = someTables.length;

    let anXCursor = XCURSOR_INITIAL;
    let anYCursor = YCURSOR_INITIAL;

    for( let aTableIdx = 0; aTableIdx < aNumTables; aTableIdx++) {
        let aTable = someTables[ aTableIdx];
        anYCursor = createAndPopulateEntity( theMendixDomainModel, aTable, somePrioritisedTableColumns, anXCursor, anYCursor);
        if( anYCursor > YCURSOR_MAX) {
            anXCursor = anXCursor + XCURSOR_SPACE;
            anYCursor = YCURSOR_INITIAL;
        }
        console.info( "Entity " + ( aTableIdx + 1) + " of " + aNumTables + "\n\n");
    }
}


function chooseAFewTables( theDBRE : Idbre, thePrioritisedTableColumns : Map<string, string[]>) : Itable[] {

    const someTables = prioritiseTables( theDBRE.table, thePrioritisedTableColumns);

    if ( MAXENTITIES < 1) {
        return someTables;
    }

    if( theDBRE.table.length <= MAXENTITIES) {
        return someTables;
    }

    return someTables.slice( 0, MAXENTITIES);
}


/* We prefer the tables involved in foreign keys because these allow to exercise creation of model associations.
 Return a list with prioritised tables sorted alphabetically, followed by not prioritised tables sorted alphabetically.
 Also collect the columns of each table which intervene in foreign keys whether as local or foreign columns
*/
function prioritiseTables( theTables : Itable[], thePrioritisedTableColumns : Map<string, string[]>) : Itable[] {

    if( !theTables.length) {
        return theTables;
    }


    // Index by name, for O ~ log N when lookup of an Itable with name == to an Itable.foreignKey.foreignTable
    let allTablesByName = new Map<string, Itable>();
    for( let aTable of theTables) {
        allTablesByName.set( aTable.name, aTable);
    }

    // Collect all tables with a foreignKey, and the tables refered by these Itable.foreignKey.foreignTable
    let somePrioritisedTables = new Map<string, Itable>();
    for( let aTable of theTables) {
        if( !aTable.foreignKey || !aTable.foreignKey.length) {
            continue;
        }

        if( !( aTable.name in somePrioritisedTables)) {
            somePrioritisedTables.set( aTable.name, aTable);
        }

        for( let aForeignKey of aTable.foreignKey) {
            if( aForeignKey.foreignTable) {
                let aReference = aForeignKey.reference;
                if( aReference) {
                    if( aReference.local) {
                        prioritiseTableColumnNamed( thePrioritisedTableColumns, aTable.name, aReference.local);
                    }
                    if( aReference.foreign) {
                        prioritiseTableColumnNamed( thePrioritisedTableColumns, aForeignKey.foreignTable, aReference.foreign);
                    }
                }
                if( !( aForeignKey.foreignTable in somePrioritisedTables)) {
                    const aForeignTable = allTablesByName.get( aForeignKey.foreignTable);
                    if( aForeignTable) {
                        somePrioritisedTables.set( aForeignKey.foreignTable, aForeignTable);
                    }
                }
            }
        }
    }

    // collect all prioritised tables, then append the ones which were not prioritised
    const someTables : Itable[] = [ ];

    // sort prioritised tables alphabetically, case-insensitive
    const somePrioritisedNames : string[] = [ ];
    for( let aPrioritisedName of somePrioritisedTables.keys()) {
        somePrioritisedNames.push( aPrioritisedName);
    }
    const someSortedPrioritisedNames = somePrioritisedNames.sort();
    for( let aTableName of someSortedPrioritisedNames) {
        let aTable = allTablesByName.get( aTableName);
        if( aTable) {
            someTables.push( aTable);
        }
    }

    const someNotPrioritisedTableNames : string[] = [ ];
    for( let aTable of theTables) {
        if( !somePrioritisedTables.has( aTable.name)) {
            someNotPrioritisedTableNames.push( aTable.name);
        }
    }

    const someSortedNotPrioritisedNames = someNotPrioritisedTableNames.sort();
    for( let aTableName of someSortedNotPrioritisedNames) {
        let aTable = allTablesByName.get( aTableName);
        if( aTable) {
            someTables.push( aTable);
        }
    }

    return someTables;
}


function prioritiseTableColumnNamed( thePrioritisedTableColumns : Map<string, string[]>, theTableName : string, theColumnName : string) {

    let somePrioritisedColumns = thePrioritisedTableColumns.get( theTableName);
    if( !somePrioritisedColumns) {
        somePrioritisedColumns = [ ];
        thePrioritisedTableColumns.set( theTableName, somePrioritisedColumns)
    }

    if( somePrioritisedColumns.indexOf( theColumnName) < 0) {
        somePrioritisedColumns.push( theColumnName);
    }
}


function createAndPopulateEntity( theMendixDomainModel : domainmodels.DomainModel, theTable: Itable, thePrioritisedTableColumns : Map<string, string[]>,
                                  theXCursor: number, theYCursor: number):number {

    console.info( "+ Entity " + theTable.name);

    const aNewEntity = domainmodels.Entity.createIn(theMendixDomainModel);
    aNewEntity.name = theTable.name;
    aNewEntity.location = { x: theXCursor, y: theYCursor };
    aNewEntity.documentation = JSON.stringify( theTable, (theKey : string, theValue : any) => { return ( theKey == "column") ? undefined : theValue; }, 4);

    const someColumns = chooseAFewAttributes( theTable, thePrioritisedTableColumns);
    console.info( "  ... about to create " + someColumns.length + " attributes");
    for( let aColumn of someColumns) {

        createAndPopulateAttribute( theMendixDomainModel, aNewEntity, aColumn);
    }
    console.info( "  ok");
    console.info( "  + " + someColumns.length + " attributes");

    return theYCursor + YCURSOR_ENTITY + ( someColumns.length * YCURSOR_ATTRIBUTE)  + YCURSOR_SPACE;
}


function chooseAFewAttributes( theTable: Itable, thePrioritisedTableColumns : Map<string, string[]>) : Icolumn[] {

    const someColumns = prioritiseAttributes( theTable.name, theTable.column, thePrioritisedTableColumns);

    if ( MAXATTRIBUTES < 1) {
        return someColumns;
    }

    if( theTable.column.length <= MAXATTRIBUTES) {
        return someColumns;
    }

    return someColumns.slice( 0, MAXATTRIBUTES);
}

/* Prefer columns which have been prioritised because being involved in a foreign key, whether as local or foreign column,
 or columns with name starting with "ID" (possibly named ID_BYDBRE by rule in method createAndPopulateAttribute because ID is reserved by Mendix model SDK).
 Sort alphabetically the prioritised or ID columns and after these append the non prioritised or ID columns also sorted alphabetically among themselves.
 */
function prioritiseAttributes( theTableName : string, theColumns : Icolumn[], thePrioritisedTableColumns : Map<string, string[]>) : Icolumn[] {

    if( !theColumns.length) {
        return theColumns;
    }

    const somePrioritisedNames : string[] = [ ];

    // Always include the columns which have been prioritised because of being involved in a foreign key as local or foreign column
    const somePrioritisedColumns = thePrioritisedTableColumns.get( theTableName);
    if( somePrioritisedColumns) {
        Array.prototype.push.apply(somePrioritisedNames, somePrioritisedColumns);
    }

    const allColumnsByName = new Map<string, Icolumn>();

    // Index the columns by name for faster log N retrieval by name later on.
    // Include the columns with name starting by ID and have not been prioritised because of being involved in a foreign key as local or foreign column
    for( let aColumn of theColumns) {

        allColumnsByName.set( aColumn.name, aColumn);

        if( somePrioritisedNames.indexOf( aColumn.name) >= 0) {
            continue;
        }

        if( aColumn.name.startsWith( "ID")) {
            if( somePrioritisedNames.indexOf( aColumn.name) >= 0) {
                continue;
            }
            somePrioritisedNames.push( aColumn.name);
        }
    }

    // Collect resulting columns
    const someColumns : Icolumn[] = [ ];

    // Prioritised and ID columns sorted among themselves
    const someSortedPrioritisedNames = somePrioritisedNames.sort();
    for( let aColumnName of someSortedPrioritisedNames) {
        let aColumn = allColumnsByName.get( aColumnName);
        if( aColumn) {
            someColumns.push( aColumn);
        }
    }


    // Non-Prioritised columns sorted among themselves
    const someNonPrioritisedNames : string[] = [ ];

    for( let aColumn of theColumns) {
        if( somePrioritisedNames.indexOf( aColumn.name) >= 0) {
            continue;
        }
        someNonPrioritisedNames.push( aColumn.name);
    }

    // Prioritised and ID columns sorted among themselves
    const someSortedNonPrioritisedNames = someNonPrioritisedNames.sort();
    for( let aColumnName of someSortedNonPrioritisedNames) {
        let aColumn = allColumnsByName.get( aColumnName);
        if( aColumn) {
            someColumns.push( aColumn);
        }
    }

    return someColumns;

}



function createAndPopulateAttribute( theMendixDomainModel : domainmodels.DomainModel, theEntity: domainmodels.Entity, theColumn: Icolumn) {

    let aColumnName = theColumn.name;
    if( aColumnName.toUpperCase() == "ID") {
        aColumnName = "ID_BYDBRE";
    }
    console.info( "   + Attribute " + aColumnName);

    const aNewAttribute = domainmodels.Attribute.createIn(theEntity);

    aNewAttribute.name = aColumnName;
    aNewAttribute.documentation = JSON.stringify( theColumn, null, 4);

    switch( theColumn.type) {

        case "3,NUMBER":
            if( theColumn.size && ( theColumn.size == 1)) {
                domainmodels.BooleanAttributeType.createIn( aNewAttribute);
            }
            else {
                domainmodels.IntegerAttributeType.createIn( aNewAttribute);
            }
            if( theColumn.size) {
                if( theColumn.size == 1) {
                    domainmodels.BooleanAttributeType.createIn( aNewAttribute);
                }
                else {
                    if( theColumn.size >= 10) {
                        domainmodels.LongAttributeType.createIn( aNewAttribute);
                    }
                    else {
                        domainmodels.IntegerAttributeType.createIn( aNewAttribute);
                    }
                }
            }
            else {
                domainmodels.IntegerAttributeType.createIn( aNewAttribute);
            }
            break;

        case "12,VARCHAR2":
            let aStringAttributeType = domainmodels.StringAttributeType.createIn( aNewAttribute);
            if ( theColumn.size) {
                aStringAttributeType.length = theColumn.size;
            }
            break;

        case "91,DATE":
            domainmodels.DateTimeAttributeType.createIn( aNewAttribute);
            break;

        case "93,DATE": /* timestamp */
            domainmodels.DateTimeAttributeType.createIn( aNewAttribute);
            break;

        case "2004,CLOB":
            let aClobAttributeType = domainmodels.StringAttributeType.createIn( aNewAttribute);
            if ( theColumn.size) {
                aClobAttributeType.length = theColumn.size;
            }
            break;

        default:
            domainmodels.StringAttributeType.createIn( aNewAttribute);
    }
}