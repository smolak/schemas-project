import { extractLabelFromSchema, extractLabelFromSchemaId, extractLabelFromSchemaType } from './utils';

const addParent = (schemaDataStructures, schemaLabel, parentLabel) => {
    schemaDataStructures[schemaLabel].parents.push(parentLabel);
};

const addChild = (schemaDataStructures, schemaLabel, childLabel) => {
    schemaDataStructures[schemaLabel].children.push(childLabel);
};

const hasDataType = (schema) => {
    const schemaType = schema['@type'];

    return Array.isArray(schemaType) && schemaType.includes('http://schema.org/DataType');
};

const hasSpecificType = (schema) => typeof schema['@type'] === 'string' && schema['@type'] !== 'rdfs:Class';

export const parseSchemas = (schemas) => {
    const schemaDataStructures = schemas.reduce((allSchemas, schema) => {
        const schemaLabel = extractLabelFromSchema(schema);
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
        const schemaLabel = extractLabelFromSchema(schema);
        const schemaSubClass = schema['rdfs:subClassOf'];

        const isOfDataType = hasDataType(schema);
        const isOfSpecificType = hasSpecificType(schema);

        if (isOfSpecificType) {
            const specificTypeLabel = extractLabelFromSchemaType(schema['@type']);

            addParent(schemaDataStructures, schemaLabel, specificTypeLabel);
            addChild(schemaDataStructures, specificTypeLabel, schemaLabel);
        }

        if (schemaSubClass) {
            const subClassData = Array.isArray(schemaSubClass) ? schemaSubClass : [schemaSubClass];

            subClassData.forEach((subClass) => {
                const parentLabel = extractLabelFromSchemaId(subClass['@id']);

                addParent(schemaDataStructures, schemaLabel, parentLabel);
                addChild(schemaDataStructures, parentLabel, schemaLabel);
            });
        }

        if (isOfDataType) {
            addParent(schemaDataStructures, schemaLabel, 'DataType');
        }
    });

    return schemaDataStructures;
};
