export const extractLabelFromSchemaType = (schemaType) => schemaType.split('http://schema.org/')[1];

export const extractLabelFromSchemaId = (schemaId) => {
    if (schemaId === 'rdfs:Class') {
        return 'Class';
    }

    return schemaId.split('http://schema.org/')[1];
};

export const extractLabelFromSchema = (schema) => {
    const label = schema['rdfs:label'];

    if (typeof label === 'object') {
        return label['@value'];
    }

    return label;
};
