import { isSchema, extractLabelFromSchema, extractLabelFromSchemaId, extractLabelFromSchemaType } from './utils';

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

const hasSpecificTypeOrTypes = (schema) => {
    return (typeof schema['@type'] === 'string' && schema['@type'] !== 'rdfs:Class') || Array.isArray(schema['@type']);
};
const typecheck = (schema) => {
    if (!isSchema(schema)) {
        throw new TypeError(`Detected an item that is not a schema. Item passed: ${JSON.stringify(schema)}`);
    }
};

const SPECIFICITY_PATH_SEPARATOR = '.';

const extendSpecificityPath = (specificityPath, childLabel) => {
    return `${specificityPath}${SPECIFICITY_PATH_SEPARATOR}${childLabel}`;
};

const addSpecificityPathsForSchema = (schemaDataStructures, schemaLabel) => {
    const { children, specificityPaths } = schemaDataStructures[schemaLabel];

    children.forEach((childLabel) => {
        const childSpecificityPaths = schemaDataStructures[childLabel].specificityPaths;

        specificityPaths.forEach((specificityPath) => {
            const pathToAdd = extendSpecificityPath(specificityPath, childLabel);

            if (!childSpecificityPaths.includes(pathToAdd)) {
                childSpecificityPaths.push(pathToAdd);
            }
        });

        addSpecificityPathsForSchema(schemaDataStructures, childLabel);
    });
};

const buildSpecificityPaths = (schemaDataStructures) => {
    const rootSchema = Object.entries(schemaDataStructures)
        .map((entry) => {
            return { label: entry[0], parents: entry[1].parents };
        })
        .find((item) => item.parents.length === 0);

    if (rootSchema) {
        const rootSchemaLabel = rootSchema.label;

        schemaDataStructures[rootSchemaLabel].specificityPaths.push(rootSchemaLabel);

        addSpecificityPathsForSchema(schemaDataStructures, rootSchemaLabel);
    }
};

export const parseSchemas = (schemas) => {
    schemas.forEach(typecheck);

    const schemaDataStructures = schemas.reduce((allSchemas, schema) => {
        const schemaLabel = extractLabelFromSchema(schema);
        const schemaDataStructure = {
            children: [],
            parents: [],
            specificityPaths: []
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
        const isOfSpecificTypeOrTypes = hasSpecificTypeOrTypes(schema);

        if (isOfSpecificTypeOrTypes && !isOfDataType) {
            const specificTypes = Array.isArray(schema['@type']) ? schema['@type'] : [schema['@type']];
            const specificTypesLabels = specificTypes.map(extractLabelFromSchemaType);

            specificTypesLabels.forEach((specificTypeLabel) => {
                addParent(schemaDataStructures, schemaLabel, specificTypeLabel);
                addChild(schemaDataStructures, specificTypeLabel, schemaLabel);
            });
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

    buildSpecificityPaths(schemaDataStructures);

    return schemaDataStructures;
};
