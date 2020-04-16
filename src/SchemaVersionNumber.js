export class SchemaVersionNumber {
    static async withFetcher(fetchVersionNumber) {
        const versionNumber = await fetchVersionNumber();

        const schemaVersionNumber = new SchemaVersionNumber();

        schemaVersionNumber.versionNumber = versionNumber;

        return schemaVersionNumber;
    }
}
