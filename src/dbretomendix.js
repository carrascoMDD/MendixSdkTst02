"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const mendixplatformsdk_1 = require("mendixplatformsdk");
const mendixmodelsdk_1 = require("mendixmodelsdk");
const dbre_1 = require("./sourcemeta/dbre");
const m2mfromdbre_1 = require("./metatomendix/m2mfromdbre");
const username = 'carrascoMendix@ModelDD.org';
const apikey = '883ea2d1-12da-45d8-9474-9f7a8363771f'; // Key description "For MendixSdkTst01" created 20180506
const baseProjectName = 'ACVappMendixSdkTst01-';
const baseEntityName = 'ACVEntity_';
const client = new mendixplatformsdk_1.MendixSdkClient(username, apikey);
/* After execution, visit https://sprintr.home.mendix.com/index.html */
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const project = yield client.platform().createNewApp(`${baseProjectName}${Date.now()}`);
        const workingCopy = yield project.createWorkingCopy();
        const domainModel = yield loadDomainModel(workingCopy);
        try {
            m2mfromdbre_1.default(domainModel, dbre_1.default);
        }
        catch (error) {
            console.error('Error during populating Mendix model:', error);
        }
        const entity = mendixmodelsdk_1.domainmodels.Entity.createIn(domainModel);
        entity.name = `${baseEntityName}${Date.now()}`;
        entity.location = { x: 100, y: 100 };
        try {
            const revision = yield workingCopy.commit();
            console.log(`Successfully committed revision: ${revision.num()}. Done.`);
        }
        catch (error) {
            console.error('Error during commit Mendix model:', error);
        }
    });
}
function loadDomainModel(workingCopy) {
    const dm = workingCopy.model().allDomainModels().filter(dm => dm.containerAsModule.name === 'MyFirstModule')[0];
    return new Promise((resolve, reject) => dm.load(resolve));
}
main();
//# sourceMappingURL=dbretomendix.js.map