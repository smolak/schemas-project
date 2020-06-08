import fs from 'fs';
import path from 'path';
import { createModuleCode, createBaseModuleCode } from './codeTemplates';
import { createFileName } from './utils';

export const buildModules = ({ buildPath, schemaData }) => {
    try {
        fs.accessSync(buildPath);
    } catch (_) {
        throw new Error('Build path is not accessible.');
    }

    const baseModuleFilePath = path.resolve(buildPath, createFileName('_base'));
    fs.writeFileSync(baseModuleFilePath, createBaseModuleCode());

    const schemaNames = Object.keys(schemaData.schemas);

    schemaNames.forEach(async (schemaName) => {
        const fileName = createFileName(schemaName);
        const filePath = path.resolve(buildPath, fileName);
        const { properties } = schemaData.schemas[schemaName];

        const parentSchemaNames = Object.keys(properties).filter(
            (propertiesGroupName) => propertiesGroupName !== 'all' && propertiesGroupName !== 'own'
        );

        const moduleCode = createModuleCode({ schemaName, parentSchemaNames, properties });

        fs.writeFileSync(filePath, moduleCode);
    });
};
