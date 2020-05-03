import dummyProperties from './properties.json';
import dummySchemas from './schemas.json';

const allDummyData = dummySchemas.concat(dummyProperties);

// eslint-disable-next-line import/no-default-export
export default {
    dummyProperties,
    dummySchemas,
    allDummyData
};
