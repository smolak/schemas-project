import fs from 'fs';
import path from 'path';
import rimraf from 'rimraf';
import mkdirp from 'mkdirp';
import { SchemasBuilder } from './SchemasBuilder';
import { fetchAllLayersData } from './fetchAllLayersData';
import { fetchLatestSchemaVersionNumber } from './fetchLatestSchemaVersionNumber';

const buildFolderPath = path.resolve(__dirname, '../build');
const schemaDataFilename = 'schemaData.json';

const createBuildFolder = () => mkdirp(buildFolderPath);
const removeBuildFolder = () => rimraf.sync(buildFolderPath);

const run = async () => {
    await removeBuildFolder();
    console.info('Removed build folder.');

    await createBuildFolder();
    console.info('Created build folder.');

    const schemasBuilder = new SchemasBuilder({
        latestVersionNumberFetcher: fetchLatestSchemaVersionNumber,
        schemasDataFetcher: fetchAllLayersData
    });

    await schemasBuilder.fetchLatestSchemaVersionNumber();
    console.info(`Schema version fetched: ${schemasBuilder.latestSchemaVersion}.`);

    await schemasBuilder.fetchSchemasData();
    console.info('Schema data fetched.');

    schemasBuilder.parseDownloadedData();
    console.info('Schema data parsed.');

    const data = schemasBuilder.combineParsedData();
    console.info('Schema data combined.');

    const filePath = path.resolve(buildFolderPath, schemaDataFilename);

    fs.writeFileSync(filePath, JSON.stringify(data));

    console.info('Schema data built.');
};

run()
    .then(() => console.info('Finished.'))
    .catch(console.error);
