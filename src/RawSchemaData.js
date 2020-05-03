import { fetchRawSchemaDataFromGitHub } from './web/fetchRawSchemaDataFromGitHub';

export class RawSchemaData {
    static async fromGitHub(schemaVersion, fetchRawData = fetchRawSchemaDataFromGitHub) {
        const data = await fetchRawData(schemaVersion);
        const self = new RawSchemaData();

        self.rawData = data.rawSchemaData;

        return self;
    }
}
