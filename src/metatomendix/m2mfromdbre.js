"use strict";
// https://sprintr.home.mendix.com/index.html
Object.defineProperty(exports, "__esModule", { value: true });
const mendixmodelsdk_1 = require("mendixmodelsdk");
/* *********************************************************
   Used to expedite trials with models smaller than the whole 120 entities and over 3000 attributes.
   If > 0 then it is the max # of entities to be created
*/
const LIMITRUN = false;
const FASTRUN = false;
const MAXENTITIES = LIMITRUN ? (FASTRUN ? 20 : 50) : 0;
const MAXATTRIBUTES = LIMITRUN ? (FASTRUN ? 6 : 10) : 16;
/* With all entities and attributes
started converting model (all etties and attrs)
16:05:39
start to open the diagram
16:06:24
actually see diagram
16:08:48
 */
const DOCUMENTATIONFROMSOURCE = false;
const XCURSOR_INITIAL = 20;
const XCURSOR_SPACE = 170;
const YCURSOR_INITIAL = 20;
const YCURSOR_ENTITY = 20;
const YCURSOR_ATTRIBUTE = 14;
const YCURSOR_SPACE = 20;
const YCURSOR_MAX = 800;
function populateMendixFromDBRE(theDomainModel, theDBRE) {
    console.info("HI!");
    const someFKTablesAndColumns = new Map();
    const someTables = chooseAFewTables(theDBRE, someFKTablesAndColumns);
    let aNumTables = someTables.length;
    let anXCursor = XCURSOR_INITIAL;
    let anYCursor = YCURSOR_INITIAL;
    for (let aTableIdx = 0; aTableIdx < aNumTables; aTableIdx++) {
        let aTable = someTables[aTableIdx];
        anYCursor = createAndPopulateEntity(theDomainModel, aTable, someFKTablesAndColumns, anXCursor, anYCursor);
        if (anYCursor > YCURSOR_MAX) {
            anXCursor = anXCursor + XCURSOR_SPACE;
            anYCursor = YCURSOR_INITIAL;
        }
        console.info("Entity " + (aTableIdx + 1) + " of " + aNumTables + "\n\n");
    }
    createAndPopulateAssociations(theDomainModel, someTables, someFKTablesAndColumns);
}
exports.default = populateMendixFromDBRE;
function chooseAFewTables(theDBRE, theFKTablesAndColumns) {
    const someTables = rankTables(theDBRE.table, theFKTablesAndColumns);
    if (MAXENTITIES < 1) {
        return someTables;
    }
    if (theDBRE.table.length <= MAXENTITIES) {
        return someTables;
    }
    return someTables.slice(0, MAXENTITIES);
}
/* We prefer the tables involved in foreign keys because these allow to exercise creation of model associations.
 Return a list with ranked tables sorted alphabetically, followed by not ranked tables sorted alphabetically.
 Also collect the columns of each table which intervene in foreign keys whether as local or foreign columns
*/
function rankTables(theTables, theFKTablesAndColumns) {
    if (!theTables.length) {
        return theTables;
    }
    // Index by name, for O ~ log N when lookup of an Itable with name == to an Itable.foreignKey.foreignTable
    let allTablesByName = new Map();
    for (let aTable of theTables) {
        allTablesByName.set(aTable.name, aTable);
    }
    // Collect all tables with a foreignKey, and the tables refered by these Itable.foreignKey.foreignTable
    let someRankedTables = new Map();
    for (let aTable of theTables) {
        if (!aTable.foreignKey || !aTable.foreignKey.length) {
            continue;
        }
        if (!(aTable.name in someRankedTables)) {
            someRankedTables.set(aTable.name, aTable);
        }
        for (let aForeignKey of aTable.foreignKey) {
            if (aForeignKey.foreignTable) {
                let aReference = aForeignKey.reference;
                if (aReference) {
                    if (aReference.local) {
                        rankTableColumnNamed(theFKTablesAndColumns, aTable.name, aReference.local);
                    }
                    if (aReference.foreign) {
                        rankTableColumnNamed(theFKTablesAndColumns, aForeignKey.foreignTable, aReference.foreign);
                    }
                }
                if (!(aForeignKey.foreignTable in someRankedTables)) {
                    const aForeignTable = allTablesByName.get(aForeignKey.foreignTable);
                    if (aForeignTable) {
                        someRankedTables.set(aForeignKey.foreignTable, aForeignTable);
                    }
                }
            }
        }
    }
    // collect all ranked tables, then append the ones which were not ranked
    const someTables = [];
    // sort alphabetically ranked tables
    const someRankedNames = [];
    for (let aRankedName of someRankedTables.keys()) {
        someRankedNames.push(aRankedName);
    }
    const someSortedRankedNames = someRankedNames.sort();
    for (let aTableName of someSortedRankedNames) {
        let aTable = allTablesByName.get(aTableName);
        if (aTable) {
            someTables.push(aTable);
        }
    }
    // collect tables which were not ranked
    const otherTableNames = [];
    for (let aTable of theTables) {
        if (!someRankedTables.has(aTable.name)) {
            otherTableNames.push(aTable.name);
        }
    }
    // sort alphabetically tables which were not ranked
    const someOtherNames = otherTableNames.sort();
    for (let aTableName of someOtherNames) {
        let aTable = allTablesByName.get(aTableName);
        if (aTable) {
            someTables.push(aTable);
        }
    }
    return someTables;
}
function rankTableColumnNamed(theFKTablesAndColumns, theTableName, theColumnName) {
    let someFKColumns = theFKTablesAndColumns.get(theTableName);
    if (!someFKColumns) {
        someFKColumns = [];
        theFKTablesAndColumns.set(theTableName, someFKColumns);
    }
    if (someFKColumns.indexOf(theColumnName) < 0) {
        someFKColumns.push(theColumnName);
    }
}
function createAndPopulateEntity(theDomainModel, theTable, theFKTablesAndColumns, theXCursor, theYCursor) {
    console.info("+ Entity " + theTable.name);
    const aNewEntity = mendixmodelsdk_1.domainmodels.Entity.createIn(theDomainModel);
    aNewEntity.name = theTable.name;
    aNewEntity.location = { x: theXCursor, y: theYCursor };
    if (DOCUMENTATIONFROMSOURCE) {
        aNewEntity.documentation = JSON.stringify(theTable, (theKey, theValue) => { return (theKey == "column") ? undefined : theValue; }, 4);
    }
    const someColumns = chooseAFewAttributes(theTable, theFKTablesAndColumns);
    console.info("  ... about to create " + someColumns.length + " attributes");
    for (let aColumn of someColumns) {
        createAndPopulateAttribute(theDomainModel, aNewEntity, aColumn);
    }
    console.info("  ok");
    console.info("  + " + someColumns.length + " attributes");
    return theYCursor + YCURSOR_ENTITY + (someColumns.length * YCURSOR_ATTRIBUTE) + YCURSOR_SPACE;
}
function chooseAFewAttributes(theTable, theFKTablesAndColumns) {
    const someColumns = rankAttributes(theTable.name, theTable.column, theFKTablesAndColumns);
    if (MAXATTRIBUTES < 1) {
        return someColumns;
    }
    if (theTable.column.length <= MAXATTRIBUTES) {
        return someColumns;
    }
    return someColumns.slice(0, MAXATTRIBUTES);
}
/* Prefer columns which have been ranked because being involved in a foreign key, whether as local or foreign column,
 or columns with name starting with "ID" (possibly named ID_BYDBRE by rule in method createAndPopulateAttribute because ID is reserved by Mendix model SDK).
 Sort alphabetically the ranked or ID columns and after these append the non ranked or ID columns also sorted alphabetically among themselves.
 */
function rankAttributes(theTableName, theColumns, theFKTablesAndColumns) {
    if (!theColumns.length) {
        return theColumns;
    }
    const someRankedNames = [];
    // Always include the columns which have been ranked because of being involved in a foreign key as local or foreign column
    const someFKColumns = theFKTablesAndColumns.get(theTableName);
    if (someFKColumns) {
        Array.prototype.push.apply(someRankedNames, someFKColumns);
    }
    const allColumnsByName = new Map();
    // Index the columns by name for faster log N retrieval by name later on.
    // Include the columns with name starting by ID and have not been ranked because of being involved in a foreign key as local or foreign column
    for (let aColumn of theColumns) {
        allColumnsByName.set(aColumn.name, aColumn);
        if (someRankedNames.indexOf(aColumn.name) >= 0) {
            continue;
        }
        if (aColumn.name.startsWith("ID")) {
            if (someRankedNames.indexOf(aColumn.name) >= 0) {
                continue;
            }
            someRankedNames.push(aColumn.name);
        }
    }
    // Collect resulting columns
    const someColumns = [];
    // Ranked and ID columns sorted among themselves
    const someSortedRankedNames = someRankedNames.sort();
    for (let aColumnName of someSortedRankedNames) {
        let aColumn = allColumnsByName.get(aColumnName);
        if (aColumn) {
            someColumns.push(aColumn);
        }
    }
    // Collect Non-Ranked  non ID columns
    const otherNames = [];
    for (let aColumn of theColumns) {
        if (someRankedNames.indexOf(aColumn.name) >= 0) {
            continue;
        }
        otherNames.push(aColumn.name);
    }
    // Non Ranked non ID columns sorted among themselves
    const otherSortedNames = otherNames.sort();
    for (let aColumnName of otherSortedNames) {
        let aColumn = allColumnsByName.get(aColumnName);
        if (aColumn) {
            someColumns.push(aColumn);
        }
    }
    return someColumns;
}
function createAndPopulateAttribute(theDomainModel, theEntity, theColumn) {
    let anAttributeName = theColumn.name;
    if (anAttributeName.toUpperCase() == "ID") {
        anAttributeName = "ID_BYDBRE";
    }
    console.info("   + Attribute " + anAttributeName);
    const aNewAttribute = mendixmodelsdk_1.domainmodels.Attribute.createIn(theEntity);
    aNewAttribute.name = anAttributeName;
    if (DOCUMENTATIONFROMSOURCE) {
        aNewAttribute.documentation = JSON.stringify(theColumn, null, 4);
    }
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
/* Create Associations from foreign keys in the reverse engineeded model.
 The tables with columns which are involved in a Foreign Key as local or foreign column have been collected in a previous step into theFKTablesAndColumns
*/
function createAndPopulateAssociations(theDomainModel, theTables, theFKTablesAndColumns) {
    // map tables by name for faster log N access below
    const allTablesByName = new Map();
    for (let aTable of theTables) {
        allTablesByName.set(aTable.name, aTable);
    }
    // Impose a deterministic order of processing tables by table name
    const someTableNames = [];
    for (let aTableName of theFKTablesAndColumns.keys()) {
        someTableNames.push(aTableName);
    }
    const someSortedTableNames = someTableNames.sort();
    for (let aTableName of someSortedTableNames) {
        const aTable = allTablesByName.get(aTableName);
        if (!aTable) {
            continue;
        }
        if (!aTable.foreignKey || !aTable.foreignKey.length) {
            continue;
        }
        // Impose a deterministic order of processing foreign keys by foreign table name
        const someForeignKeysSorted = aTable.foreignKey.sort((theFK1, theFK2) => { return theFK1.foreignTable.localeCompare(theFK2.foreignTable); });
        // iterate over foreign keys. Each is candidate to produce an association
        for (let aForeignKey of someForeignKeysSorted) {
            const aLocalColumn = columnByName(aTable.column, aForeignKey.reference.local);
            if (!aLocalColumn) {
                continue;
            }
            const aForeignTable = allTablesByName.get(aForeignKey.foreignTable);
            if (!aForeignTable) {
                continue;
            }
            const aForeignColumn = columnByName(aForeignTable.column, aForeignKey.reference.foreign);
            if (!aForeignColumn) {
                continue;
            }
            const someEntities = theDomainModel.entities.filter(theEntity => theEntity.name == aTable.name);
            if (!someEntities || !someEntities.length) {
                continue;
            }
            const anEntity = someEntities[0];
            const someForeignEntities = theDomainModel.entities.filter(theEntity => theEntity.name == aForeignTable.name);
            if (!someForeignEntities || !someForeignEntities.length) {
                continue;
            }
            const aForeignEntity = someForeignEntities[0];
            console.info("   + Association " + aForeignKey.name);
            // https://apidocs.mendix.com/modelsdk/latest/classes/domainmodels.association.html
            const aNewAssociation = mendixmodelsdk_1.domainmodels.Association.createIn(theDomainModel);
            aNewAssociation.name = aForeignKey.name;
            aNewAssociation.parent = aForeignEntity;
            aNewAssociation.parentConnection = aForeignEntity.location;
            aNewAssociation.child = anEntity;
            aNewAssociation.childConnection = anEntity.location;
            aNewAssociation.type = mendixmodelsdk_1.domainmodels.AssociationType.ReferenceSet;
            aNewAssociation.owner = mendixmodelsdk_1.domainmodels.AssociationOwner.Default;
        }
    }
}
function columnByName(theColumns, theName) {
    for (let aColumn of theColumns) {
        if (aColumn.name == theName) {
            return aColumn;
        }
    }
    return undefined;
}
//# sourceMappingURL=m2mfromdbre.js.map