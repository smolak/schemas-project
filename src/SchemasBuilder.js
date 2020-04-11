import { isSchema, isProperty } from './utils';
import { parseProperties } from './propertiesParser';
import { parseSchemas } from './schemasParser';

const removeArchived = (items) => {
    return items.filter((item) => {
        if (item['http://schema.org/isPartOf']) {
            return item['http://schema.org/isPartOf']['@id'] !== 'http://attic.schema.org';
        }

        return true;
    });
};

export class SchemasBuilder {
    constructor({ latestVersionNumberFetcher, schemasDataFetcher }) {
        this.schemas = {};
        this.properties = {};
        this.schemasRaw = [];
        this.propertiesRaw = [];
        this.latestSchemaVersion = null;
        this.latestSchemaVersionNumberFetcher = latestVersionNumberFetcher;
        this.schemasDataFetcher = schemasDataFetcher;
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

        this.properties = parseProperties(this.propertiesRaw);
        this.schemas = parseSchemas(this.schemasRaw);
    }
}
