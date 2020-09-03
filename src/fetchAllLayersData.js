import fetch from 'node-fetch';

const buildAllLayersDataUrl = (schemaVersion) => {
    return `https://raw.githubusercontent.com/schemaorg/schemaorg/main/data/releases/${schemaVersion}/all-layers.jsonld`;
};
const allLayersDataFetcher = (schemaVersion) =>
    fetch(buildAllLayersDataUrl(schemaVersion))
        .then((res) => res.json())
        .then((data) => {
            return {
                rawSchemaData: data['@graph']
            };
        });

export const fetchAllLayersData = (schemaVersion, fetchLayersData = allLayersDataFetcher) => {
    return fetchLayersData(schemaVersion).then(({ rawSchemaData }) => rawSchemaData);
};
