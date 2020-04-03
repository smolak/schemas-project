export const extractSchemaLabel = (schema) => {
    const schemaLabel = schema['rdfs:label'];

    if (typeof schemaLabel === 'object') {
        return schemaLabel['@value'];
    }

    return schemaLabel;
};
