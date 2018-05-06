
import { domainmodels } from 'mendixmodelsdk';

import { Idbre, Itable } from '../sourcemeta/idbre';


export default function populateMendixFromDBRE( theMendixDomainModel : domainmodels.DomainModel, theDBRE : Idbre) {


    const someTables : Itable[] = theDBRE.table;
    console.info( "HI!");

    let anYCursor = 100;

    for( let aTable of someTables) {

        anYCursor = createAndPopulateEntity( theMendixDomainModel, aTable, anYCursor);
    }
}

function createAndPopulateEntity( theMendixDomainModel : domainmodels.DomainModel, theTable: Itable, theYCursor:number):number {

    const aNewEntity = domainmodels.Entity.createIn(theMendixDomainModel);
    aNewEntity.name = theTable.name;
    aNewEntity.location = { x: 100, y: theYCursor };

    return theYCursor + 60;
}