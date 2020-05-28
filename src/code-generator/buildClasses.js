import fs from 'fs';
import path from 'path';

export const buildClasses = ({ buildPath, schemaData }) => {
    try {
        fs.accessSync(buildPath);
    } catch (_) {
        throw new Error('Build path is not accessible.');
    }

    const schemaNames = Object.keys(schemaData.schemas);
    const createFileName = (schemaName) => `${schemaName}.js`;

    schemaNames.forEach((schemaName) => {
        const fileName = createFileName(schemaName);
        const filePath = path.resolve(buildPath, fileName);

        fs.writeFileSync(filePath, '');
    });
};
