export const extractLabelFromId = (schemaId) => {
    if (schemaId === 'rdfs:Class') {
        return 'Class';
    }

    return schemaId.split('http://schema.org/')[1];
};

export const extractSchemaLabel = (schema) => {
    const schemaLabel = schema['rdfs:label'];

    if (typeof schemaLabel === 'object') {
        return schemaLabel['@value'];
    }

    return schemaLabel;
};
