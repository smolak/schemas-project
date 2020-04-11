import { isProperty, extractLabelFromProperty, extractLabelFromSchemaId } from './utils';

const takeSchemaId = (item) => item['@id'];

const extractSchemaLabelsPropertyIsUsedIn = (property) => {
    const domainIncludes = property['http://schema.org/domainIncludes'];
    const usedInSchemas = Array.isArray(domainIncludes) ? domainIncludes : [domainIncludes];

    return usedInSchemas.map(takeSchemaId).map(extractLabelFromSchemaId);
};

const extractValueTypesPropertyCanHave = (property) => {
    const rangeIncludes = property['http://schema.org/rangeIncludes'];
    const schemasPropertyHaveValueIn = Array.isArray(rangeIncludes) ? rangeIncludes : [rangeIncludes];

    return schemasPropertyHaveValueIn.map(takeSchemaId).map(extractLabelFromSchemaId);
};

const takeIfInfoWhereItIsUsedAndWhatValueTypesItCanHave = (property) => {
    return property['http://schema.org/domainIncludes'] && property['http://schema.org/rangeIncludes'];
};

const typecheck = (property) => {
    if (!isProperty(property)) {
        throw new TypeError(`Detected an item that is not a property. Item passed: ${JSON.stringify(property)}`);
    }
};

export const parseProperties = (properties) => {
    properties.forEach(typecheck);

    return properties.filter(takeIfInfoWhereItIsUsedAndWhatValueTypesItCanHave).reduce((dataStructure, property) => {
        const propertyLabel = extractLabelFromProperty(property);
        const propertyDataStructure = {
            usedIn: extractSchemaLabelsPropertyIsUsedIn(property),
            valueTypes: extractValueTypesPropertyCanHave(property)
        };

        return {
            ...dataStructure,
            [propertyLabel]: propertyDataStructure
        };
    }, {});
};
