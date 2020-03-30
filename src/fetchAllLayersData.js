import fetch from 'node-fetch';

const buildAllLayersDataUrl = (schemaVersion) => {
    return `https://raw.githubusercontent.com/schemaorg/schemaorg/master/data/releases/${schemaVersion}/all-layers.jsonld`;
};
const allLayersDataFetcher = (schemaVersion) => fetch(buildAllLayersDataUrl(schemaVersion)).then((res) => res.json());

export const fetchAllLayersData = (schemaVersion, fetchLayersData = allLayersDataFetcher) => {
    return fetchLayersData(schemaVersion).then((data) => data['@graph']);
};
