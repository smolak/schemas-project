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

        this.schemasRaw = activeData.filter((item) => item['@type'] === 'rdfs:Class');
        this.propertiesRaw = activeData.filter((item) => item['@type'] === 'rdf:Property');
    }
}
