import fetch from 'node-fetch';

const VERSIONS_FILE_URL = 'https://raw.githubusercontent.com/schemaorg/schemaorg/master/versions.json';

export const fetchLatestSchemaVersionNumberFromGithub = () => {
    return fetch(VERSIONS_FILE_URL)
        .then((res) => res.json())
        .then((data) => {
            return {
                schemaVersionNumber: data.schemaversion
            };
        });
};
