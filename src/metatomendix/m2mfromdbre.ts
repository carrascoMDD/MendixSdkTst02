
import { domainmodels } from 'mendixmodelsdk';

import {Icolumn, Idbre, Itable} from '../sourcemeta/idbre';

const XCURSOR_INITIAL = 100;
const XCURSOR_SPACE = 150;
const YCURSOR_INITIAL = 100;
const YCURSOR_ENTITY = 20;
const YCURSOR_ATTRIBUTE = 14;
const YCURSOR_SPACE = 20;
const YCURSOR_MAX = 2000;

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
            anYCursor = YCURSOR_INITIAL;
        }
        console.info( "Entity " + ( aTableIdx + 1) + " of " + aNumTables + "\n\n");
    }
}

function createAndPopulateEntity( theMendixDomainModel : domainmodels.DomainModel, theTable: Itable, theXCursor: number, theYCursor: number):number {

    console.info( "+ Entity " + theTable.name);

    const aNewEntity = domainmodels.Entity.createIn(theMendixDomainModel);
    aNewEntity.name = theTable.name;
    aNewEntity.location = { x: theXCursor, y: theYCursor };


    const someColumns : Icolumn[] = theTable.column;
    console.info( "  ... about to create " + someColumns.length + " attributes");
    for( let aColumn of someColumns) {

        createAndPopulateAttribute( theMendixDomainModel, aNewEntity, aColumn);
    }
    console.info( "  ok");
    console.info( "  + " + someColumns.length + " attributes");

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
    switch( theColumn.type) {

        case "3,NUMBER":
            domainmodels.IntegerAttributeType.createIn( aNewAttribute);
            break;

        case "12,VARCHAR2":
            domainmodels.StringAttributeType.createIn( aNewAttribute);
            break;

        case "91,DATE":
            domainmodels.DateTimeAttributeType.createIn( aNewAttribute);
            break;

        case "93,DATE": /* timestamp */
            domainmodels.DateTimeAttributeType.createIn( aNewAttribute);
            break;

        case "2004,CLOB": /* timestamp */
            domainmodels.StringAttributeType.createIn( aNewAttribute);
            break;

        default:
            domainmodels.StringAttributeType.createIn( aNewAttribute);
    }
}