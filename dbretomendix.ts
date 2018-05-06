import { MendixSdkClient, OnlineWorkingCopy } from 'mendixplatformsdk';
import { domainmodels } from 'mendixmodelsdk';

import DBRE  from './src/sourcemeta/dbre';
import populateMendixFromDBRE from './src/metatomendix/m2mfromdbre';

const username = 'carrascoMendix@ModelDD.org';
const apikey = '883ea2d1-12da-45d8-9474-9f7a8363771f'; // Key description "For MendixSdkTst01" created 20180506
const baseProjectName = 'ACVappMendixSdkTst01-';
const baseEntityName = 'ACVEntity_';
const client = new MendixSdkClient(username, apikey);

/* After execution, visit https://sprintr.home.mendix.com/index.html */

async function main() {
    const project = await client.platform().createNewApp(`${baseProjectName}${Date.now()}`);
    const workingCopy = await project.createWorkingCopy();

    const domainModel = await loadDomainModel(workingCopy);

    try {
        populateMendixFromDBRE( domainModel, DBRE);
    }
    catch (error) {
        console.error('Error during populating Mendix model:', error);
    }

    const entity = domainmodels.Entity.createIn(domainModel);
    entity.name = `${baseEntityName}${Date.now()}`;
    entity.location = { x: 100, y: 100 };

    try {
        const revision = await workingCopy.commit();
        console.log(`Successfully committed revision: ${revision.num()}. Done.`)
    }
    catch (error) {
        console.error('Error during commit Mendix model:', error);
    }
}

function loadDomainModel(workingCopy: OnlineWorkingCopy): Promise<domainmodels.DomainModel> {
    const dm = workingCopy.model().allDomainModels().filter(dm => dm.containerAsModule.name === 'MyFirstModule')[0];

    return new Promise((resolve, reject) => dm.load(resolve));
}

main();