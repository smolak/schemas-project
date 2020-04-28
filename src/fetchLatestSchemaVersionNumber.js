import fetch from 'node-fetch';

const CONFIG_FILE_URL = 'https://raw.githubusercontent.com/schemaorg/schemaorg/master/versions.json';

const versionDataFetcher = () =>
    fetch(CONFIG_FILE_URL)
        .then((res) => res.json())
        .then((data) => {
            return {
                schemaVersionNumber: data.schemaversion
            };
        });

export const fetchLatestSchemaVersionNumber = (fetchVersionData = versionDataFetcher) => {
    return fetchVersionData().then(({ schemaVersionNumber }) => schemaVersionNumber);
};
