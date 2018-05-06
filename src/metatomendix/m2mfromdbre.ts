
import { domainmodels } from 'mendixmodelsdk';

import {Icolumn, Idbre, Itable} from '../sourcemeta/idbre';

const XCURSOR_INITIAL = 100;
const XCURSOR_SPACE = 180;
const YCURSOR_INITIAL = 100;
const YCURSOR_ENTITY = 20;
const YCURSOR_ATTRIBUTE = 16;
const YCURSOR_SPACE = 40;
const YCURSOR_MAX = 4000;

export default function populateMendixFromDBRE( theMendixDomainModel : domainmodels.DomainModel, theDBRE : Idbre) {


    const someTables : Itable[] = theDBRE.table;
    console.info( "HI!");

    let anXCursor = XCURSOR_INITIAL;
    let anYCursor = YCURSOR_INITIAL;

    let aNumTables = someTables.length;
    for( let aTableIdx = 0; aTableIdx < aNumTables; aTableIdx++) {
        let aTable = someTables[ aTableIdx];
        anYCursor = createAndPopulateEntity( theMendixDomainModel, aTable, anXCursor, anYCursor);
        if( anYCursor > YCURSOR_MAX) {
            anXCursor = anXCursor + XCURSOR_SPACE;
        }
        console.info( "Entity " + aTableIdx + " of " + aNumTables + "\n\n");
    }
}

function createAndPopulateEntity( theMendixDomainModel : domainmodels.DomainModel, theTable: Itable, theXCursor: number, theYCursor: number):number {

    console.info( "+ Entity " + theTable.name);

    const aNewEntity = domainmodels.Entity.createIn(theMendixDomainModel);
    aNewEntity.name = theTable.name;
    aNewEntity.location = { x: theXCursor, y: theYCursor };

    const someColumns : Icolumn[] = theTable.column;
    for( let aColumn of someColumns) {

        createAndPopulateAttribute( theMendixDomainModel, aNewEntity, aColumn);
    }
    console.info( "  ok");

    return theYCursor + YCURSOR_ENTITY + ( someColumns.length * YCURSOR_ATTRIBUTE)  + YCURSOR_SPACE;
}


function createAndPopulateAttribute( theMendixDomainModel : domainmodels.DomainModel, theEntity: domainmodels.Entity, theColumn: Icolumn) {

    let aColumnName = theColumn.name;
    if( aColumnName.toUpperCase() == "ID") {
        aColumnName = "ID_BYDBRE";
    }
    console.info( "   + Attribute " + aColumnName);

    const aNewAttribute = domainmodels.Attribute.createIn(theEntity);

    aNewAttribute.name = aColumnName;
    domainmodels.StringAttributeType.createIn( aNewAttribute);
}