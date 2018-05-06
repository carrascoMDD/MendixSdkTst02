"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mendixmodelsdk_1 = require("mendixmodelsdk");
/* *********************************************************
   Used to expedite trials with models smaller than the whole 120 entities and over 3000 attributes.
   If > 0 then it is the max # of entities to be created
*/
const MAXENTITIES = 10;
const MAXATTRIBUTES = 10;
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
    if (MAXENTITIES < 1) {
        return theDBRE.table;
    }
    if (theDBRE.table.length < MAXENTITIES) {
        return theDBRE.table;
    }
    return theDBRE.table.slice(0, MAXENTITIES);
}
function createAndPopulateEntity(theMendixDomainModel, theTable, theXCursor, theYCursor) {
    console.info("+ Entity " + theTable.name);
    const aNewEntity = mendixmodelsdk_1.domainmodels.Entity.createIn(theMendixDomainModel);
    aNewEntity.name = theTable.name;
    aNewEntity.location = { x: theXCursor, y: theYCursor };
    aNewEntity.documentation = JSON.stringify(theTable, men(theKey, string, theValue, any), { return(theKey) { } } == "column") ? undefined : theValue;
}
4;
;
const someColumns = chooseAFewAttributes(theTable);
console.info("  ... about to create " + someColumns.length + " attributes");
for (let aColumn of someColumns) {
    createAndPopulateAttribute(theMendixDomainModel, aNewEntity, aColumn);
}
console.info("  ok");
console.info("  + " + someColumns.length + " attributes");
return theYCursor + YCURSOR_ENTITY + (someColumns.length * YCURSOR_ATTRIBUTE) + YCURSOR_SPACE;
function chooseAFewAttributes(theTable) {
    if (MAXATTRIBUTES < 1) {
        return theTable.column;
    }
    if (theTable.column.length < MAXATTRIBUTES) {
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