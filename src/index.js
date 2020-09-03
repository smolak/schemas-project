import fs from 'fs';
import path from 'path';
import rimraf from 'rimraf';
import mkdirp from 'mkdirp';
import { SchemasBuilder } from './SchemasBuilder';
import { fetchAllLayersData } from './fetchAllLayersData';
import { fetchLatestSchemaVersionNumber } from './fetchLatestSchemaVersionNumber';
import { buildModules } from './modules-generator/buildModules';

const buildFolderPath = path.resolve(__dirname, '../build');
const schemaDataFolderPath = path.resolve(buildFolderPath, 'schemaData');
const modulesFolderPath = path.resolve(buildFolderPath, 'modules');
const schemaDataFilename = 'schemaData.json';

const createFolder = (folderPath) => mkdirp(folderPath);
const createBuildFolder = () => {
    createFolder(buildFolderPath);
    createFolder(schemaDataFolderPath);
    createFolder(modulesFolderPath);
};
const removeBuildFolder = () => rimraf.sync(buildFolderPath);

// eslint-disable-next-line
const logMessage = (message) => console.info(message);

const run = async () => {
    await removeBuildFolder();
    logMessage('Removed build folder.');

    await createBuildFolder();
    logMessage('Created build folder.');

    const schemasBuilder = new SchemasBuilder({
        latestVersionNumberFetcher: fetchLatestSchemaVersionNumber,
        schemasDataFetcher: fetchAllLayersData
    });

    await schemasBuilder.fetchLatestSchemaVersionNumber();
    logMessage(`Schema version fetched: ${schemasBuilder.latestSchemaVersion}.`);

    await schemasBuilder.fetchSchemasData();
    logMessage('Schema data fetched.');

    schemasBuilder.parseDownloadedData();
    logMessage('Schema data parsed.');

    const data = schemasBuilder.combineParsedData();
    logMessage('Schema data combined.');

    const schemaDataFilePath = path.resolve(schemaDataFolderPath, schemaDataFilename);

    fs.writeFileSync(schemaDataFilePath, JSON.stringify(data));
    logMessage('Schema data file built.');

    logMessage('Building modules...');
    buildModules({ buildPath: modulesFolderPath, schemaData: data });
    logMessage('Done building modules.');
};

run()
    .then(() => logMessage('All finished 🎉'))
    // eslint-disable-next-line
    .catch(console.error);
