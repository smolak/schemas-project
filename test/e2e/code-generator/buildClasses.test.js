import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import tmp from 'tmp';
import path from 'path';
import mkdirp from 'mkdirp';
import rimraf from 'rimraf';
import fs from 'fs';
import { buildClasses } from '../../../src/code-generator/buildClasses';
import schemaData from '../../dummy-data/schemaData.json';

describe('buildClasses', () => {
    const schemasInSchemaData = Object.keys(schemaData.schemas);
    const testBuildFolder = 'build';
    let tempDir;

    beforeEach(() => {
        tempDir = tmp.dirSync({ mode: 0o750, prefix: 'myTmpDir_' });
        mkdirp.sync(path.resolve(tempDir.name, testBuildFolder));
    });

    afterEach(() => {
        rimraf.sync(path.resolve(tempDir.name, testBuildFolder));

        tempDir.removeCallback();
    });

    describe('buildPath config option', () => {
        describe("when path doesn't exist", () => {
            it('should throw', () => {
                const buildPath = '/some/non-existent/or/non-accessible/build/path';

                expect(() => buildClasses({ buildPath })).to.throw('Build path is not accessible.');
            });
        });
    });

    it('should create files named after Schemas coming from schema data', () => {
        const buildPath = path.resolve(tempDir.name, testBuildFolder);

        buildClasses({ buildPath, schemaData });

        const files = fs.readdirSync(buildPath);
        const schemaClassFileNames = schemasInSchemaData.map((schemaName) => `${schemaName}.js`);

        expect(files).to.have.members(schemaClassFileNames);
    });
});
