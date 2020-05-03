import fetch from 'node-fetch';

const buildUrl = (schemaVersion) => {
    return `https://raw.githubusercontent.com/schemaorg/schemaorg/master/data/releases/${schemaVersion}/all-layers.jsonld`;
};

export const fetchRawSchemaDataFromGitHub = (schemaVersion) => {
    return fetch(buildUrl(schemaVersion))
        .then((res) => res.json())
        .then((data) => {
            return {
                rawSchemaData: data['@graph']
            };
        });
};
