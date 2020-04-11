export const extractLabelFromSchemaType = (schemaType) => schemaType.split('http://schema.org/')[1];

export const extractLabelFromSchemaId = (schemaId) => {
    if (schemaId === 'rdfs:Class') {
        return 'Class';
    }

    return schemaId.split('http://schema.org/')[1];
};

const extractLabel = (schemaOrProperty) => {
    const label = schemaOrProperty['rdfs:label'];

    if (typeof label === 'object') {
        return label['@value'];
    }

    return label;
};

export const extractLabelFromProperty = extractLabel;
export const extractLabelFromSchema = extractLabel;

export const isProperty = (item) => item['@type'] === 'rdf:Property';

export const isSchema = (item) => !isProperty(item);
