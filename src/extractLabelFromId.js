export const extractLabelFromId = (schemaId) => {
    if (schemaId === 'rdfs:Class') {
        return 'Class';
    }

    return schemaId.split('http://schema.org/')[1];
};
