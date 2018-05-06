
import { domainmodels } from 'mendixmodelsdk';

import {Icolumn, Idbre, Itable} from '../sourcemeta/idbre';

/* *********************************************************
   Used to expedite trials with models smaller than the whole 120 entities and over 3000 attributes.
   If > 0 then it is the max # of entities to be created
*/
const MAXENTITIES   = 50;
const MAXATTRIBUTES = 5;


const XCURSOR_INITIAL = 100;
const XCURSOR_SPACE = 150;
const YCURSOR_INITIAL = 100;
const YCURSOR_ENTITY = 20;
const YCURSOR_ATTRIBUTE = 14;
const YCURSOR_SPACE = 20;
const YCURSOR_MAX = 2000;

export default function populateMendixFromDBRE( theMendixDomainModel : domainmodels.DomainModel, theDBRE : Idbre) {

    console.info( "HI!");

    const someTables = chooseAFewTables( theDBRE);
    let aNumTables = someTables.length;

    let anXCursor = XCURSOR_INITIAL;
    let anYCursor = YCURSOR_INITIAL;

    for( let aTableIdx = 0; aTableIdx < aNumTables; aTableIdx++) {
        let aTable = someTables[ aTableIdx];
        anYCursor = createAndPopulateEntity( theMendixDomainModel, aTable, anXCursor, anYCursor);
        if( anYCursor > YCURSOR_MAX) {
            anXCursor = anXCursor + XCURSOR_SPACE;
            anYCursor = YCURSOR_INITIAL;
        }
        console.info( "Entity " + ( aTableIdx + 1) + " of " + aNumTables + "\n\n");
    }
}


function chooseAFewTables( theDBRE : Idbre) : Itable[] {

    const someTables = prioritiseTables( theDBRE.table);

    if ( MAXENTITIES < 1) {
        return someTables;
    }

    if( theDBRE.table.length <= MAXENTITIES) {
        return someTables;
    }

    return someTables.slice( 0, MAXENTITIES);
}


// We prefer the tables involved in foreign keys because these allow to exercise creation of model associations
// Return a list with prioritised tables sorted alphabetically, followed by not prioritised tables sorted alphabetically
function prioritiseTables( theTables : Itable[]) : Itable[] {

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


function createAndPopulateEntity( theMendixDomainModel : domainmodels.DomainModel, theTable: Itable, theXCursor: number, theYCursor: number):number {

    console.info( "+ Entity " + theTable.name);

    const aNewEntity = domainmodels.Entity.createIn(theMendixDomainModel);
    aNewEntity.name = theTable.name;
    aNewEntity.location = { x: theXCursor, y: theYCursor };
    aNewEntity.documentation = JSON.stringify( theTable, (theKey : string, theValue : any) => { return ( theKey == "column") ? undefined : theValue; }, 4);

    const someColumns = chooseAFewAttributes( theTable);
    console.info( "  ... about to create " + someColumns.length + " attributes");
    for( let aColumn of someColumns) {

        createAndPopulateAttribute( theMendixDomainModel, aNewEntity, aColumn);
    }
    console.info( "  ok");
    console.info( "  + " + someColumns.length + " attributes");

    return theYCursor + YCURSOR_ENTITY + ( someColumns.length * YCURSOR_ATTRIBUTE)  + YCURSOR_SPACE;
}


function chooseAFewAttributes( theTable: Itable) : Icolumn[] {

    if ( MAXATTRIBUTES < 1) {
        return theTable.column;
    }

    if( theTable.column.length <= MAXATTRIBUTES) {
        return theTable.column
    }

    return theTable.column.slice( 0, MAXATTRIBUTES);
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