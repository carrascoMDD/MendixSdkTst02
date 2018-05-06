"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mendixmodelsdk_1 = require("mendixmodelsdk");
/* *********************************************************
   Used to expedite trials with models smaller than the whole 120 entities and over 3000 attributes.
   If > 0 then it is the max # of entities to be created
*/
const MAXENTITIES = 50;
const MAXATTRIBUTES = 5;
const XCURSOR_INITIAL = 100;
const XCURSOR_SPACE = 150;
const YCURSOR_INITIAL = 100;
const YCURSOR_ENTITY = 20;
const YCURSOR_ATTRIBUTE = 14;
const YCURSOR_SPACE = 20;
const YCURSOR_MAX = 2000;
function populateMendixFromDBRE(theMendixDomainModel, theDBRE) {
    console.info("HI!");
    const someTables = chooseAFewTables(theDBRE);
    let aNumTables = someTables.length;
    let anXCursor = XCURSOR_INITIAL;
    let anYCursor = YCURSOR_INITIAL;
    for (let aTableIdx = 0; aTableIdx < aNumTables; aTableIdx++) {
        let aTable = someTables[aTableIdx];
        anYCursor = createAndPopulateEntity(theMendixDomainModel, aTable, anXCursor, anYCursor);
        if (anYCursor > YCURSOR_MAX) {
            anXCursor = anXCursor + XCURSOR_SPACE;
            anYCursor = YCURSOR_INITIAL;
        }
        console.info("Entity " + (aTableIdx + 1) + " of " + aNumTables + "\n\n");
    }
}
exports.default = populateMendixFromDBRE;
function chooseAFewTables(theDBRE) {
    const someTables = prioritiseTables(theDBRE.table);
    if (MAXENTITIES < 1) {
        return someTables;
    }
    if (theDBRE.table.length <= MAXENTITIES) {
        return someTables;
    }
    return someTables.slice(0, MAXENTITIES);
}
// We prefer the tables involved in foreign keys because these allow to exercise creation of model associations
// Return a list with prioritised tables sorted alphabetically, followed by not prioritised tables sorted alphabetically
function prioritiseTables(theTables) {
    if (!theTables.length) {
        return theTables;
    }
    // Index by name, for O ~ log N when lookup of an Itable with name == to an Itable.foreignKey.foreignTable
    let allTablesByName = new Map();
    for (let aTable of theTables) {
        allTablesByName.set(aTable.name, aTable);
    }
    // Collect all tables with a foreignKey, and the tables refered by these Itable.foreignKey.foreignTable
    let somePrioritisedTables = new Map();
    for (let aTable of theTables) {
        if (!aTable.foreignKey || !aTable.foreignKey.length) {
            continue;
        }
        if (!(aTable.name in somePrioritisedTables)) {
            somePrioritisedTables.set(aTable.name, aTable);
        }
        for (let aForeignKey of aTable.foreignKey) {
            if (aForeignKey.foreignTable) {
                if (!(aForeignKey.foreignTable in somePrioritisedTables)) {
                    const aForeignTable = allTablesByName.get(aForeignKey.foreignTable);
                    if (aForeignTable) {
                        somePrioritisedTables.set(aForeignKey.foreignTable, aForeignTable);
                    }
                }
            }
        }
    }
    // collect all prioritised tables, then append the ones which were not prioritised
    const someTables = [];
    // sort prioritised tables alphabetically, case-insensitive
    const somePrioritisedNames = [];
    for (let aPrioritisedName of somePrioritisedTables.keys()) {
        somePrioritisedNames.push(aPrioritisedName);
    }
    const someSortedPrioritisedNames = somePrioritisedNames.sort();
    for (let aTableName of someSortedPrioritisedNames) {
        let aTable = allTablesByName.get(aTableName);
        if (aTable) {
            someTables.push(aTable);
        }
    }
    const someNotPrioritisedTableNames = [];
    for (let aTable of theTables) {
        if (!somePrioritisedTables.has(aTable.name)) {
            someNotPrioritisedTableNames.push(aTable.name);
        }
    }
    const someSortedNotPrioritisedNames = someNotPrioritisedTableNames.sort();
    for (let aTableName of someSortedNotPrioritisedNames) {
        let aTable = allTablesByName.get(aTableName);
        if (aTable) {
            someTables.push(aTable);
        }
    }
    return someTables;
}
function createAndPopulateEntity(theMendixDomainModel, theTable, theXCursor, theYCursor) {
    console.info("+ Entity " + theTable.name);
    const aNewEntity = mendixmodelsdk_1.domainmodels.Entity.createIn(theMendixDomainModel);
    aNewEntity.name = theTable.name;
    aNewEntity.location = { x: theXCursor, y: theYCursor };
    aNewEntity.documentation = JSON.stringify(theTable, (theKey, theValue) => { return (theKey == "column") ? undefined : theValue; }, 4);
    const someColumns = chooseAFewAttributes(theTable);
    console.info("  ... about to create " + someColumns.length + " attributes");
    for (let aColumn of someColumns) {
        createAndPopulateAttribute(theMendixDomainModel, aNewEntity, aColumn);
    }
    console.info("  ok");
    console.info("  + " + someColumns.length + " attributes");
    return theYCursor + YCURSOR_ENTITY + (someColumns.length * YCURSOR_ATTRIBUTE) + YCURSOR_SPACE;
}
function chooseAFewAttributes(theTable) {
    if (MAXATTRIBUTES < 1) {
        return theTable.column;
    }
    if (theTable.column.length <= MAXATTRIBUTES) {
        return theTable.column;
    }
    return theTable.column.slice(0, MAXATTRIBUTES);
}
function createAndPopulateAttribute(theMendixDomainModel, theEntity, theColumn) {
    let aColumnName = theColumn.name;
    if (aColumnName.toUpperCase() == "ID") {
        aColumnName = "ID_BYDBRE";
    }
    console.info("   + Attribute " + aColumnName);
    const aNewAttribute = mendixmodelsdk_1.domainmodels.Attribute.createIn(theEntity);
    aNewAttribute.name = aColumnName;
    aNewAttribute.documentation = JSON.stringify(theColumn, null, 4);
    switch (theColumn.type) {
        case "3,NUMBER":
            if (theColumn.size && (theColumn.size == 1)) {
                mendixmodelsdk_1.domainmodels.BooleanAttributeType.createIn(aNewAttribute);
            }
            else {
                mendixmodelsdk_1.domainmodels.IntegerAttributeType.createIn(aNewAttribute);
            }
            if (theColumn.size) {
                if (theColumn.size == 1) {
                    mendixmodelsdk_1.domainmodels.BooleanAttributeType.createIn(aNewAttribute);
                }
                else {
                    if (theColumn.size >= 10) {
                        mendixmodelsdk_1.domainmodels.LongAttributeType.createIn(aNewAttribute);
                    }
                    else {
                        mendixmodelsdk_1.domainmodels.IntegerAttributeType.createIn(aNewAttribute);
                    }
                }
            }
            else {
                mendixmodelsdk_1.domainmodels.IntegerAttributeType.createIn(aNewAttribute);
            }
            break;
        case "12,VARCHAR2":
            let aStringAttributeType = mendixmodelsdk_1.domainmodels.StringAttributeType.createIn(aNewAttribute);
            if (theColumn.size) {
                aStringAttributeType.length = theColumn.size;
            }
            break;
        case "91,DATE":
            mendixmodelsdk_1.domainmodels.DateTimeAttributeType.createIn(aNewAttribute);
            break;
        case "93,DATE": /* timestamp */
            mendixmodelsdk_1.domainmodels.DateTimeAttributeType.createIn(aNewAttribute);
            break;
        case "2004,CLOB":
            let aClobAttributeType = mendixmodelsdk_1.domainmodels.StringAttributeType.createIn(aNewAttribute);
            if (theColumn.size) {
                aClobAttributeType.length = theColumn.size;
            }
            break;
        default:
            mendixmodelsdk_1.domainmodels.StringAttributeType.createIn(aNewAttribute);
    }
}
//# sourceMappingURL=m2mfromdbre.js.map