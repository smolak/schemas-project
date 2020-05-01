import { fetchLatestSchemaVersionNumberFromGithub } from './web/fetchLatestSchemaVersionNumberFromGithub';

export class SchemaVersionNumber {
    static async fromGitHub(fetchVersionNumberFromGitHub = fetchLatestSchemaVersionNumberFromGithub) {
        const data = await fetchVersionNumberFromGitHub();
        const self = new SchemaVersionNumber();

        self.versionNumber = data.schemaVersionNumber;

        return self;
    }

    static async withFetcher(fetchVersionNumber) {
        const versionNumber = await fetchVersionNumber();

        const schemaVersionNumber = new SchemaVersionNumber();

        schemaVersionNumber.versionNumber = versionNumber;

        return schemaVersionNumber;
    }
}
