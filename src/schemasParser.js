const extractSchemaLabel = (schemaId) => schemaId.split('http://schema.org/')[1];

export const parseSchemas = (schemas) => {
    const schemaDataStructures = schemas.reduce((allSchemas, schema) => {
        const schemaLabel = schema['rdfs:label'];
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
        const schemaLabel = schema['rdfs:label'];
        const schemaSubClass = schema['rdfs:subClassOf'];

        if (schemaSubClass) {
            const subClassData = Array.isArray(schemaSubClass) ? schemaSubClass : [schemaSubClass];

            subClassData.forEach((subClass) => {
                const parentLabel = extractSchemaLabel(subClass['@id']);

                schemaDataStructures[parentLabel].children.push(schemaLabel);
                schemaDataStructures[schemaLabel].parents.push(parentLabel);
            });
        }
    });

    return schemaDataStructures;
};
