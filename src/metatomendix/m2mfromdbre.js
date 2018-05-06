"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mendixmodelsdk_1 = require("mendixmodelsdk");
function populateMendixFromDBRE(theMendixDomainModel, theDBRE) {
    const someTables = theDBRE.table;
    console.info("HI!");
    let anYCursor = 100;
    for (let aTable of someTables) {
        anYCursor = createAndPopulateEntity(theMendixDomainModel, aTable, anYCursor);
    }
}
exports.default = populateMendixFromDBRE;
function createAndPopulateEntity(theMendixDomainModel, theTable, theYCursor) {
    const aNewEntity = mendixmodelsdk_1.domainmodels.Entity.createIn(theMendixDomainModel);
    aNewEntity.name = theTable.name;
    aNewEntity.location = { x: 100, y: theYCursor };
    return theYCursor + 60;
}
//# sourceMappingURL=m2mfromdbre.js.map