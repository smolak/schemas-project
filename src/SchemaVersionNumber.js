import { fetchLatestSchemaVersionNumberFromGithub } from './web/fetchLatestSchemaVersionNumberFromGithub';

export class SchemaVersionNumber {
    static async fromGitHub(fetchVersionNumberFromGitHub = fetchLatestSchemaVersionNumberFromGithub) {
        const data = await fetchVersionNumberFromGitHub();
        const self = new SchemaVersionNumber();

        self.versionNumber = data.schemaVersionNumber;

        return self;
    }
}
