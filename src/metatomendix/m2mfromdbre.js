"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mendixmodelsdk_1 = require("mendixmodelsdk");
const XCURSOR_INITIAL = 100;
const XCURSOR_SPACE = 150;
const YCURSOR_INITIAL = 100;
const YCURSOR_ENTITY = 20;
const YCURSOR_ATTRIBUTE = 14;
const YCURSOR_SPACE = 20;
const YCURSOR_MAX = 2000;
function populateMendixFromDBRE(theMendixDomainModel, theDBRE) {
    const someTables = theDBRE.table;
    console.info("HI!");
    let anXCursor = XCURSOR_INITIAL;
    let anYCursor = YCURSOR_INITIAL;
    let aNumTables = someTables.length;
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
function createAndPopulateEntity(theMendixDomainModel, theTable, theXCursor, theYCursor) {
    console.info("+ Entity " + theTable.name);
    const aNewEntity = mendixmodelsdk_1.domainmodels.Entity.createIn(theMendixDomainModel);
    aNewEntity.name = theTable.name;
    aNewEntity.location = { x: theXCursor, y: theYCursor };
    const someColumns = theTable.column;
    console.info("  ... about to create " + someColumns.length + " attributes");
    for (let aColumn of someColumns) {
        createAndPopulateAttribute(theMendixDomainModel, aNewEntity, aColumn);
    }
    console.info("  ok");
    console.info("  + " + someColumns.length + " attributes");
    return theYCursor + YCURSOR_ENTITY + (someColumns.length * YCURSOR_ATTRIBUTE) + YCURSOR_SPACE;
}
function createAndPopulateAttribute(theMendixDomainModel, theEntity, theColumn) {
    let aColumnName = theColumn.name;
    if (aColumnName.toUpperCase() == "ID") {
        aColumnName = "ID_BYDBRE";
    }
    console.info("   + Attribute " + aColumnName);
    const aNewAttribute = mendixmodelsdk_1.domainmodels.Attribute.createIn(theEntity);
    aNewAttribute.name = aColumnName;
    switch (theColumn.type) {
        case "3,NUMBER":
            mendixmodelsdk_1.domainmodels.IntegerAttributeType.createIn(aNewAttribute);
            break;
        case "12,VARCHAR2":
            mendixmodelsdk_1.domainmodels.StringAttributeType.createIn(aNewAttribute);
            break;
        case "91,DATE":
            mendixmodelsdk_1.domainmodels.DateTimeAttributeType.createIn(aNewAttribute);
            break;
        case "93,DATE": /* timestamp */
            mendixmodelsdk_1.domainmodels.DateTimeAttributeType.createIn(aNewAttribute);
            break;
        case "2004,CLOB": /* timestamp */
            mendixmodelsdk_1.domainmodels.StringAttributeType.createIn(aNewAttribute);
            break;
        default:
            mendixmodelsdk_1.domainmodels.StringAttributeType.createIn(aNewAttribute);
    }
}
//# sourceMappingURL=m2mfromdbre.js.map