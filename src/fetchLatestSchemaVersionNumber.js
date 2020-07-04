import fetch from 'node-fetch';

const CONFIG_FILE_URL = 'https://raw.githubusercontent.com/schemaorg/schemaorg/master/versions.json';

const versionDataFetcher = () =>
    fetch(CONFIG_FILE_URL)
        .then((res) => res.json())
        .then((data) => data);

export const fetchLatestSchemaVersionNumber = (fetchVersionData = versionDataFetcher) => {
    return fetchVersionData().then(({ releaseLog }) => {
        const now = new Date();
        const entries = Object.entries(releaseLog);
        const [versionNumber] = entries.find(([, releaseDate]) => {
            return now >= new Date(releaseDate);
        });

        return versionNumber;
    });
};
