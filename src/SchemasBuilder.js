import { isSchema, isProperty } from './utils';
import { parseProperties } from './propertiesParser';
import { parseSchemas } from './schemasParser';
import { specificityPath } from './specificityPath';

const removeArchived = (items) => {
    return items.filter((item) => {
        if (item['http://schema.org/isPartOf']) {
            return item['http://schema.org/isPartOf']['@id'] !== 'http://attic.schema.org';
        }

        return true;
    });
};

const makeSureParentsAreUnique = (parents) => [...new Set(parents)];

export class SchemasBuilder {
    constructor({
        latestVersionNumberFetcher,
        schemasDataFetcher,
        propertiesParser = parseProperties,
        schemasParser = parseSchemas
    }) {
        this.parsedSchemas = {};
        this.parsedProperties = {};
        this.schemasRaw = [];
        this.propertiesRaw = [];
        this.latestSchemaVersion = null;
        this.latestSchemaVersionNumberFetcher = latestVersionNumberFetcher;
        this.schemasDataFetcher = schemasDataFetcher;
        this.parseProperties = propertiesParser;
        this.parseSchemas = schemasParser;
    }

    async fetchLatestSchemaVersionNumber() {
        this.latestSchemaVersion = await this.latestSchemaVersionNumberFetcher();
    }

    async fetchSchemasData() {
        if (!this.latestSchemaVersion) {
            throw new Error('Fetch schema version first. It is needed for downloading schema data for that version.');
        }

        const schemaData = await this.schemasDataFetcher(this.latestSchemaVersion);
        const activeData = removeArchived(schemaData);

        this.schemasRaw = activeData.filter(isSchema);
        this.propertiesRaw = activeData.filter(isProperty);
    }

    parseDownloadedData() {
        if (this.propertiesRaw.length === 0) {
            throw new Error('`propertiesRaw` are required to be set before parsing can be done.');
        }

        if (this.schemasRaw.length === 0) {
            throw new Error('`schemasRaw` are required to be set before parsing can be done.');
        }

        this.parsedProperties = this.parseProperties(this.propertiesRaw);
        this.parsedSchemas = this.parseSchemas(this.schemasRaw);
    }

    combineParsedData() {
        if (Object.entries(this.parsedProperties).length === 0) {
            throw new Error("`parsedProperties` are required for data to be combined and can't be empty.");
        }

        if (Object.entries(this.parsedSchemas).length === 0) {
            throw new Error("`parsedSchemas` are required for data to be combined and can't be empty.");
        }

        const parsedPropertiesEntries = Object.entries(this.parsedProperties);
        const extractSchemasFromSpecificityPaths = (specificityPaths) => {
            const schemasFromAllPaths = specificityPaths.map(specificityPath.split).flat(Infinity);

            return [...new Set(schemasFromAllPaths)];
        };
        const getPropertiesForSchema = (schemaLabel) => {
            return parsedPropertiesEntries
                .filter(([, propertyData]) => {
                    return propertyData.usedIn.includes(schemaLabel);
                })
                .map(([propertyLabel]) => propertyLabel);
        };

        const schemas = Object.entries(this.parsedSchemas).reduce((allSchemas, [schemaLabel, schemaData]) => {
            const extractedSchemas = extractSchemasFromSpecificityPaths(schemaData.specificityPaths);
            const ancestorSchemas = extractedSchemas.filter((extractedSchema) => extractedSchema !== schemaLabel);

            const ancestorsProperties = ancestorSchemas.reduce((allAncestorProperties, ancestorSchema) => {
                return {
                    ...allAncestorProperties,
                    [ancestorSchema]: getPropertiesForSchema(ancestorSchema).sort()
                };
            }, {});

            return {
                ...allSchemas,
                [schemaLabel]: {
                    ...schemaData,
                    children: schemaData.children.sort(),
                    parents: makeSureParentsAreUnique(schemaData.parents).sort(),
                    properties: {
                        all: extractedSchemas.map(getPropertiesForSchema).flat().sort(),
                        own: getPropertiesForSchema(schemaLabel).sort(),
                        ...ancestorsProperties
                    }
                }
            };
        }, {});

        return {
            schemas,
            properties: this.parsedProperties
        };
    }
}
