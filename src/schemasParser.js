import { extractSchemaLabel, extractLabelFromId } from './utils';

const hasDataType = (schema) => {
    const schemaType = schema['@type'];

    return Array.isArray(schemaType) && schemaType.includes('http://schema.org/DataType');
};

const hasSpecificType = (schema) => typeof schema['@type'] === 'string' && schema['@type'] !== 'rdfs:Class';

export const parseSchemas = (schemas) => {
    const schemaDataStructures = schemas.reduce((allSchemas, schema) => {
        const schemaLabel = extractSchemaLabel(schema);
        const schemaDataStructure = {
            children: [],
            parents: []
        };

        return {
            ...allSchemas,
            [schemaLabel]: schemaDataStructure
        };
    }, {});

    schemas.forEach((schema) => {
        const schemaLabel = extractSchemaLabel(schema);
        const schemaSubClass = schema['rdfs:subClassOf'];

        const isOfDataType = hasDataType(schema);
        const isOfSpecificType = hasSpecificType(schema);

        if (isOfSpecificType) {
            const specificTypeLabel = extractLabelFromId(schema['@type']);

            schemaDataStructures[schemaLabel].parents.push(specificTypeLabel);
            schemaDataStructures[specificTypeLabel].children.push(schemaLabel);
        }

        if (schemaSubClass) {
            const subClassData = Array.isArray(schemaSubClass) ? schemaSubClass : [schemaSubClass];

            subClassData.forEach((subClass) => {
                const parentLabel = extractLabelFromId(subClass['@id']);

                schemaDataStructures[parentLabel].children.push(schemaLabel);
                schemaDataStructures[schemaLabel].parents.push(parentLabel);
            });
        }

        if (isOfDataType) {
            schemaDataStructures[schemaLabel].parents.push('DataType');
        }
    });

    return schemaDataStructures;
};
