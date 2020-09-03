import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import tmp from 'tmp';
import path from 'path';
import mkdirp from 'mkdirp';
import rimraf from 'rimraf';
import fs from 'fs';
import { buildModules } from '../../../src/modules-generator/buildModules';
import { importBuiltModules } from '../../helpers/importBuiltModules';
import schemaData from '../../dummy-data/schemaData.json';

describe('buildModules', () => {
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

                expect(() => buildModules({ buildPath })).to.throw('Build path is not accessible.');
            });
        });
    });

    const getSchemaName = ({ _schemaName }) => _schemaName;

    it('should create modules named after Schemas coming from schema data', () => {
        const buildPath = path.resolve(tempDir.name, testBuildFolder);

        buildModules({ buildPath, schemaData });

        const fileNames = fs.readdirSync(buildPath);
        const schemasInSchemaData = Object.keys(schemaData.schemas);
        const expectedFileNames = schemasInSchemaData.map((schemaName) => `${schemaName}.js`);

        expect(fileNames).to.include.members(expectedFileNames);
    });

    describe('built modules', () => {
        it('should be objects', () => {
            const buildPath = path.resolve(tempDir.name, testBuildFolder);

            buildModules({ buildPath, schemaData });

            return importBuiltModules({ buildPath, schemaData }).then((resolvedModules) => {
                resolvedModules.forEach((Schema) => {
                    expect(typeof Schema).to.equal('object');
                });
            });
        });

        it("should contain all schema's own properties as functions", () => {
            const buildPath = path.resolve(tempDir.name, testBuildFolder);

            buildModules({ buildPath, schemaData });

            return importBuiltModules({ buildPath, schemaData }).then((resolvedModules) => {
                resolvedModules.forEach((Schema) => {
                    const schemaName = getSchemaName(Schema);
                    const ownProperties = schemaData.schemas[schemaName].properties.own;

                    ownProperties.forEach((propertyName) => {
                        expect(typeof Schema[propertyName]).to.equal('function');
                    });
                });
            });
        });

        it("should have access to properties inherited from all of schema's ancestors", () => {
            const buildPath = path.resolve(tempDir.name, testBuildFolder);

            buildModules({ buildPath, schemaData });

            return importBuiltModules({ buildPath, schemaData }).then((resolvedModules) => {
                resolvedModules.forEach((Schema) => {
                    const schemaName = getSchemaName(Schema);
                    const { properties } = schemaData.schemas[schemaName];
                    const ancestorProperties = properties.all.filter((property) => !properties.own.includes(property));

                    ancestorProperties.forEach((propertyName) => {
                        expect(typeof Schema[propertyName]).to.equal('function');
                    });
                });
            });
        });

        describe('every property of built Schema module', () => {
            it('should return itemprop for self', () => {
                const buildPath = path.resolve(tempDir.name, testBuildFolder);

                buildModules({ buildPath, schemaData });

                return importBuiltModules({ buildPath, schemaData }).then((resolvedModules) => {
                    resolvedModules.forEach((module) => {
                        const schemaName = getSchemaName(module);
                        const allProperties = schemaData.schemas[schemaName].properties.all;

                        allProperties.forEach((propertyName) => {
                            expect(module[propertyName]()).to.equal(`itemprop="${propertyName}"`);
                        });
                    });
                });
            });

            describe('when called with a Schema module', () => {
                it('should create a scope for that Schema', () => {
                    const buildPath = path.resolve(tempDir.name, testBuildFolder);

                    buildModules({ buildPath, schemaData });

                    return importBuiltModules({ buildPath, schemaData }).then((resolvedModules) => {
                        const PropertyValue = resolvedModules.find(
                            (module) => getSchemaName(module) === 'PropertyValue'
                        );

                        resolvedModules.forEach((Schema) => {
                            const propertyThatCanCreateAScope = 'identifier';

                            // Not all schemas have properties, hence the check
                            if (module[propertyThatCanCreateAScope]) {
                                const result = Schema.identifier(PropertyValue);

                                expect(result).to.contain('itemscope itemtype="http://schema.org/PropertyValue"');
                            }
                        });
                    });
                });
            });

            describe('when called with a Schema that is not accepted as a value', () => {
                it('should not allow to call it with that Schema', () => {
                    const buildPath = path.resolve(tempDir.name, testBuildFolder);

                    buildModules({ buildPath, schemaData });

                    return importBuiltModules({ buildPath, schemaData }).then((resolvedModules) => {
                        const LocalBusiness = resolvedModules.find(
                            (module) => getSchemaName(module) === 'LocalBusiness'
                        );

                        resolvedModules.forEach((module) => {
                            const propertyThatDoesNotAcceptLocalBusinessAsValue = 'name';
                            const valueTypesForName = schemaData.properties.name.valueTypes;

                            // Not all schemas have properties, hence the check
                            if (module[propertyThatDoesNotAcceptLocalBusinessAsValue]) {
                                expect(() => module.name(LocalBusiness)).to.throw(
                                    `'LocalBusiness' can't be used as value for 'name' property. 'name' accepts only: '${valueTypesForName.join(
                                        "', "
                                    )}'.`
                                );
                            }
                        });
                    });
                });
            });

            describe('when called with a Text data type Schema', () => {
                it("should return Text value as is in 'content' attribute", () => {
                    const buildPath = path.resolve(tempDir.name, testBuildFolder);

                    buildModules({ buildPath, schemaData });

                    return importBuiltModules({ buildPath, schemaData }).then((resolvedModules) => {
                        const Person = resolvedModules.find((module) => getSchemaName(module) === 'Person');
                        const DataType = resolvedModules.find((module) => getSchemaName(module) === 'DataType');

                        const result = Person.name(DataType.text('John'));

                        expect(result).to.contain(' content="John"');
                    });
                });

                describe('when contains double quotes', () => {
                    it('should escape them', () => {
                        const buildPath = path.resolve(tempDir.name, testBuildFolder);

                        buildModules({ buildPath, schemaData });

                        return importBuiltModules({ buildPath, schemaData }).then((resolvedModules) => {
                            const Person = resolvedModules.find((module) => getSchemaName(module) === 'Person');
                            const DataType = resolvedModules.find((module) => getSchemaName(module) === 'DataType');

                            const result = Person.name(DataType.text('John "The Bull" Doe'));

                            expect(result).to.contain(' content="John &quot;The Bull&quot; Doe"');
                        });
                    });
                });

                describe('when value is an empty string', () => {
                    it('should not accept such value', () => {
                        const buildPath = path.resolve(tempDir.name, testBuildFolder);

                        buildModules({ buildPath, schemaData });

                        return importBuiltModules({ buildPath, schemaData }).then((resolvedModules) => {
                            const Person = resolvedModules.find((module) => getSchemaName(module) === 'Person');
                            const DataType = resolvedModules.find((module) => getSchemaName(module) === 'DataType');

                            expect(() => Person.name(DataType.text(''))).to.throw(
                                "Empty string passed. Value can't be empty."
                            );
                        });
                    });
                });

                describe('when value is not a string', () => {
                    it('should not accept such value', () => {
                        const buildPath = path.resolve(tempDir.name, testBuildFolder);

                        buildModules({ buildPath, schemaData });

                        return importBuiltModules({ buildPath, schemaData }).then((resolvedModules) => {
                            const Person = resolvedModules.find((module) => getSchemaName(module) === 'Person');
                            const DataType = resolvedModules.find((module) => getSchemaName(module) === 'DataType');

                            expect(() => Person.name(DataType.text(42))).to.throw(
                                "String value expected. 'number' (42) passed."
                            );
                        });
                    });
                });
            });

            describe('when called with a CssSelectorType data type Schema', () => {
                it("should return CssSelector value as is in 'content' attribute", () => {
                    const buildPath = path.resolve(tempDir.name, testBuildFolder);

                    buildModules({ buildPath, schemaData });

                    return importBuiltModules({ buildPath, schemaData }).then((resolvedModules) => {
                        const WebPageElement = resolvedModules.find(
                            (module) => getSchemaName(module) === 'WebPageElement'
                        );
                        const DataType = resolvedModules.find((module) => getSchemaName(module) === 'DataType');

                        const result = WebPageElement.cssSelector(DataType.cssSelectorType('.some-class'));

                        expect(result).to.contain(' content=".some-class"');
                    });
                });

                describe('when contains double quotes', () => {
                    it('should escape them', () => {
                        const buildPath = path.resolve(tempDir.name, testBuildFolder);

                        buildModules({ buildPath, schemaData });

                        return importBuiltModules({ buildPath, schemaData }).then((resolvedModules) => {
                            const WebPageElement = resolvedModules.find(
                                (module) => getSchemaName(module) === 'WebPageElement'
                            );
                            const DataType = resolvedModules.find((module) => getSchemaName(module) === 'DataType');

                            const result = WebPageElement.cssSelector(
                                DataType.cssSelectorType('a[href="https://example.com"]')
                            );

                            expect(result).to.contain(' content="a[href=&quot;https://example.com&quot;]"');
                        });
                    });
                });

                describe('when value is an empty string', () => {
                    it('should not accept such value', () => {
                        const buildPath = path.resolve(tempDir.name, testBuildFolder);

                        buildModules({ buildPath, schemaData });

                        return importBuiltModules({ buildPath, schemaData }).then((resolvedModules) => {
                            const WebPageElement = resolvedModules.find(
                                (module) => getSchemaName(module) === 'WebPageElement'
                            );
                            const DataType = resolvedModules.find((module) => getSchemaName(module) === 'DataType');

                            expect(() => WebPageElement.cssSelector(DataType.cssSelectorType(''))).to.throw(
                                "Empty string passed. Value can't be empty."
                            );
                        });
                    });
                });

                describe('when value is not a string', () => {
                    it('should not accept such value', () => {
                        const buildPath = path.resolve(tempDir.name, testBuildFolder);

                        buildModules({ buildPath, schemaData });

                        return importBuiltModules({ buildPath, schemaData }).then((resolvedModules) => {
                            const WebPageElement = resolvedModules.find(
                                (module) => getSchemaName(module) === 'WebPageElement'
                            );
                            const DataType = resolvedModules.find((module) => getSchemaName(module) === 'DataType');

                            expect(() => WebPageElement.cssSelector(DataType.cssSelectorType(42))).to.throw(
                                "String value expected. 'number' (42) passed."
                            );
                        });
                    });
                });
            });

            describe('when called with a XPathType data type Schema', () => {
                it("should return XPathType value as is in 'content' attribute", () => {
                    const buildPath = path.resolve(tempDir.name, testBuildFolder);

                    buildModules({ buildPath, schemaData });

                    return importBuiltModules({ buildPath, schemaData }).then((resolvedModules) => {
                        const WebPageElement = resolvedModules.find(
                            (module) => getSchemaName(module) === 'WebPageElement'
                        );
                        const DataType = resolvedModules.find((module) => getSchemaName(module) === 'DataType');

                        const result = WebPageElement.xpath(DataType.xPathType('/some/path'));

                        expect(result).to.contain(' content="/some/path"');
                    });
                });

                describe('when value is an empty string', () => {
                    it('should not accept such value', () => {
                        const buildPath = path.resolve(tempDir.name, testBuildFolder);

                        buildModules({ buildPath, schemaData });

                        return importBuiltModules({ buildPath, schemaData }).then((resolvedModules) => {
                            const WebPageElement = resolvedModules.find(
                                (module) => getSchemaName(module) === 'WebPageElement'
                            );
                            const DataType = resolvedModules.find((module) => getSchemaName(module) === 'DataType');

                            expect(() => WebPageElement.xpath(DataType.xPathType(''))).to.throw(
                                "Empty string passed. Value can't be empty."
                            );
                        });
                    });
                });

                describe('when value is not a string', () => {
                    it('should not accept such value', () => {
                        const buildPath = path.resolve(tempDir.name, testBuildFolder);

                        buildModules({ buildPath, schemaData });

                        return importBuiltModules({ buildPath, schemaData }).then((resolvedModules) => {
                            const WebPageElement = resolvedModules.find(
                                (module) => getSchemaName(module) === 'WebPageElement'
                            );
                            const DataType = resolvedModules.find((module) => getSchemaName(module) === 'DataType');

                            expect(() => WebPageElement.xpath(DataType.xPathType(42))).to.throw(
                                "String value expected. 'number' (42) passed."
                            );
                        });
                    });
                });
            });

            describe('when called with a URL data type Schema', () => {
                it("should return URL value as is in 'content' attribute", () => {
                    const buildPath = path.resolve(tempDir.name, testBuildFolder);

                    buildModules({ buildPath, schemaData });

                    return importBuiltModules({ buildPath, schemaData }).then((resolvedModules) => {
                        const Place = resolvedModules.find((module) => getSchemaName(module) === 'Place');
                        const DataType = resolvedModules.find((module) => getSchemaName(module) === 'DataType');

                        const result = Place.sameAs(DataType.url('https://example.com'));

                        expect(result).to.contain(' content="https://example.com"');
                    });
                });

                describe('when contains double quotes', () => {
                    it('should escape them', () => {
                        const buildPath = path.resolve(tempDir.name, testBuildFolder);

                        buildModules({ buildPath, schemaData });

                        return importBuiltModules({ buildPath, schemaData }).then((resolvedModules) => {
                            const Place = resolvedModules.find((module) => getSchemaName(module) === 'Place');
                            const DataType = resolvedModules.find((module) => getSchemaName(module) === 'DataType');

                            const result = Place.sameAs(DataType.url('https://example.com?q="something"'));

                            expect(result).to.contain(' content="https://example.com?q=&quot;something&quot;');
                        });
                    });
                });

                describe('when value is not a URL', () => {
                    it('should not accept such value', () => {
                        const buildPath = path.resolve(tempDir.name, testBuildFolder);

                        buildModules({ buildPath, schemaData });

                        return importBuiltModules({ buildPath, schemaData }).then((resolvedModules) => {
                            const Place = resolvedModules.find((module) => getSchemaName(module) === 'Place');
                            const DataType = resolvedModules.find((module) => getSchemaName(module) === 'DataType');

                            expect(() => Place.sameAs(DataType.url(42))).to.throw('Value passed (42) is not a URL.');
                        });
                    });
                });
            });

            describe('when called with a PronounceableText data type Schema', () => {
                it('is not used anywhere as DataType yet', () => {});
            });

            describe('when called with a Boolean data type Schema', () => {
                it("should return Boolean value as is in 'content' attribute", () => {
                    const buildPath = path.resolve(tempDir.name, testBuildFolder);

                    buildModules({ buildPath, schemaData });

                    return importBuiltModules({ buildPath, schemaData }).then((resolvedModules) => {
                        const Place = resolvedModules.find((module) => getSchemaName(module) === 'Place');
                        const DataType = resolvedModules.find((module) => getSchemaName(module) === 'DataType');

                        const result = Place.smokingAllowed(DataType.boolean(true));

                        expect(result).to.contain(' content="true"');
                    });
                });

                describe('when value is not of boolean type', () => {
                    it('should not accept such value', () => {
                        const buildPath = path.resolve(tempDir.name, testBuildFolder);

                        buildModules({ buildPath, schemaData });

                        return importBuiltModules({ buildPath, schemaData }).then((resolvedModules) => {
                            const Place = resolvedModules.find((module) => getSchemaName(module) === 'Place');
                            const DataType = resolvedModules.find((module) => getSchemaName(module) === 'DataType');

                            expect(() => Place.smokingAllowed(DataType.boolean('foo'))).to.throw(
                                "Boolean value expected. 'string' (foo) passed."
                            );
                        });
                    });
                });
            });

            describe('when called with a True data type Schema', () => {
                it('is not used anywhere as DataType yet', () => {});
            });

            describe('when called with a False data type Schema', () => {
                it('is not used anywhere as DataType yet', () => {});
            });

            describe('when called with a Number data type Schema', () => {
                it("should return Number value as is in 'content' attribute", () => {
                    const buildPath = path.resolve(tempDir.name, testBuildFolder);

                    buildModules({ buildPath, schemaData });

                    return importBuiltModules({ buildPath, schemaData }).then((resolvedModules) => {
                        const Place = resolvedModules.find((module) => getSchemaName(module) === 'Place');
                        const DataType = resolvedModules.find((module) => getSchemaName(module) === 'DataType');

                        const result = Place.longitude(DataType.number(12.15));

                        expect(result).to.contain(' content="12.15"');
                    });
                });

                describe('when value is not finite', () => {
                    it('should not accept such value', () => {
                        const buildPath = path.resolve(tempDir.name, testBuildFolder);

                        buildModules({ buildPath, schemaData });

                        return importBuiltModules({ buildPath, schemaData }).then((resolvedModules) => {
                            const Place = resolvedModules.find((module) => getSchemaName(module) === 'Place');
                            const DataType = resolvedModules.find((module) => getSchemaName(module) === 'DataType');

                            expect(() => Place.longitude(DataType.number(Infinity))).to.throw(
                                'Infinite value passed. Use finite number.'
                            );
                            expect(() => Place.longitude(DataType.number(-Infinity))).to.throw(
                                'Infinite value passed. Use finite number.'
                            );
                        });
                    });
                });

                describe('when value is not a number', () => {
                    it('should not accept such value', () => {
                        const buildPath = path.resolve(tempDir.name, testBuildFolder);

                        buildModules({ buildPath, schemaData });

                        return importBuiltModules({ buildPath, schemaData }).then((resolvedModules) => {
                            const Place = resolvedModules.find((module) => getSchemaName(module) === 'Place');
                            const DataType = resolvedModules.find((module) => getSchemaName(module) === 'DataType');

                            expect(() => Place.longitude(DataType.number(true))).to.throw(
                                "Number value expected. 'boolean' (true) passed."
                            );
                        });
                    });
                });
            });

            describe('when called with an Integer data type Schema', () => {
                it("should return Integer value as is in 'content' attribute", () => {
                    const buildPath = path.resolve(tempDir.name, testBuildFolder);

                    buildModules({ buildPath, schemaData });

                    return importBuiltModules({ buildPath, schemaData }).then((resolvedModules) => {
                        const CreativeWork = resolvedModules.find((module) => getSchemaName(module) === 'CreativeWork');
                        const DataType = resolvedModules.find((module) => getSchemaName(module) === 'DataType');

                        const result = CreativeWork.position(DataType.integer(42));

                        expect(result).to.contain(' content="42"');
                    });
                });

                describe('when value is not an integer', () => {
                    it('should not accept such value', () => {
                        const buildPath = path.resolve(tempDir.name, testBuildFolder);

                        buildModules({ buildPath, schemaData });

                        return importBuiltModules({ buildPath, schemaData }).then((resolvedModules) => {
                            const CreativeWork = resolvedModules.find(
                                (module) => getSchemaName(module) === 'CreativeWork'
                            );
                            const DataType = resolvedModules.find((module) => getSchemaName(module) === 'DataType');

                            expect(() => CreativeWork.position(DataType.integer(true))).to.throw(
                                "Integer value expected. 'boolean' (true) passed."
                            );
                        });
                    });
                });
            });

            describe('when called with a Float data type Schema', () => {
                it('is not used anywhere as DataType yet', () => {});
            });

            describe('when called with a Date data type Schema', () => {
                describe('when Date is passed as string', () => {
                    it("should return Date value as is in 'content' attribute", () => {
                        const buildPath = path.resolve(tempDir.name, testBuildFolder);

                        buildModules({ buildPath, schemaData });

                        return importBuiltModules({ buildPath, schemaData }).then((resolvedModules) => {
                            const MediaObject = resolvedModules.find(
                                (module) => getSchemaName(module) === 'MediaObject'
                            );
                            const DataType = resolvedModules.find((module) => getSchemaName(module) === 'DataType');

                            const fullDate = MediaObject.uploadDate(DataType.date('2020-05-27'));
                            const yearAndMonth = MediaObject.uploadDate(DataType.date('2020-05'));
                            const yearOnly = MediaObject.uploadDate(DataType.date('2020'));
                            const bcDate = MediaObject.uploadDate(DataType.date('-2020-10-15'));

                            expect(fullDate).to.contain(' content="2020-05-27"');
                            expect(yearAndMonth).to.contain(' content="2020-05"');
                            expect(yearOnly).to.contain(' content="2020"');
                            expect(bcDate).to.contain(' content="-2020-10-15"');
                        });
                    });

                    describe('when passed not in ISO 8601 format', () => {
                        it('should not accept such value', () => {
                            const buildPath = path.resolve(tempDir.name, testBuildFolder);

                            buildModules({ buildPath, schemaData });

                            return importBuiltModules({ buildPath, schemaData }).then((resolvedModules) => {
                                const MediaObject = resolvedModules.find(
                                    (module) => getSchemaName(module) === 'MediaObject'
                                );
                                const DataType = resolvedModules.find((module) => getSchemaName(module) === 'DataType');
                                const nonIso8601DateFormatExamples = {
                                    americanFormatWithDashes: '2020-27-05',
                                    americanFormatWithDots: '2020.27.05',
                                    americanFormatWithSlashes: '2020/27/05',
                                    normalRestOfTheWorldFormatWithDots: '2020.05.27',
                                    normalRestOfTheWorldFormatWithSlashes: '2020/05/27',
                                    someDateTime: '2020-05-27 15:04',
                                    iso8601FormatButADateTime: '2020-08-29T12:03:18+00:00'
                                };

                                Object.values(nonIso8601DateFormatExamples).forEach((nonIso8601DateFormat) => {
                                    expect(() => MediaObject.uploadDate(DataType.date(nonIso8601DateFormat))).to.throw(
                                        `Date in ISO 8601 format expected. ${nonIso8601DateFormat} passed.`
                                    );
                                });
                            });
                        });
                    });
                });

                describe("when Date is passed as a Date (JavaScript's) instance", () => {
                    it("should return Date value as is in 'content' attribute", () => {
                        const buildPath = path.resolve(tempDir.name, testBuildFolder);

                        buildModules({ buildPath, schemaData });

                        return importBuiltModules({ buildPath, schemaData }).then((resolvedModules) => {
                            const MediaObject = resolvedModules.find(
                                (module) => getSchemaName(module) === 'MediaObject'
                            );
                            const DataType = resolvedModules.find((module) => getSchemaName(module) === 'DataType');
                            const date = new Date(Date.UTC(2020, 5, 12));

                            const result = MediaObject.uploadDate(DataType.date(date));

                            expect(result).to.contain(` content="2020-06-12"`);
                        });
                    });
                });

                describe('when Date is any other value', () => {
                    it('should not accept such value', () => {
                        const buildPath = path.resolve(tempDir.name, testBuildFolder);

                        buildModules({ buildPath, schemaData });

                        return importBuiltModules({ buildPath, schemaData }).then((resolvedModules) => {
                            const MediaObject = resolvedModules.find(
                                (module) => getSchemaName(module) === 'MediaObject'
                            );
                            const DataType = resolvedModules.find((module) => getSchemaName(module) === 'DataType');

                            expect(() => MediaObject.uploadDate(DataType.date(true))).to.throw(
                                "String or Date instance value expected. 'boolean' (true) passed."
                            );
                        });
                    });
                });
            });

            describe('when called with a DateTime data type Schema', () => {
                describe('when DateTime is passed as string', () => {
                    it("should return DateTime value as is in 'content' attribute", () => {
                        const buildPath = path.resolve(tempDir.name, testBuildFolder);

                        buildModules({ buildPath, schemaData });

                        return importBuiltModules({ buildPath, schemaData }).then((resolvedModules) => {
                            const MediaObject = resolvedModules.find(
                                (module) => getSchemaName(module) === 'MediaObject'
                            );
                            const DataType = resolvedModules.find((module) => getSchemaName(module) === 'DataType');

                            const dateTime = MediaObject.startTime(DataType.dateTime('2020-08-29T12:03:18'));
                            const zoneDateTime = MediaObject.startTime(DataType.dateTime('2020-08-29T12:03:18Z'));
                            const shiftedDateTime = MediaObject.startTime(
                                DataType.dateTime('2020-08-29T12:03:18+01:00')
                            );
                            const bcDateTime = MediaObject.startTime(DataType.dateTime('-2020-08-29T12:03:18Z'));

                            expect(dateTime).to.contain(' content="2020-08-29T12:03:18"');
                            expect(zoneDateTime).to.contain(' content="2020-08-29T12:03:18Z"');
                            expect(shiftedDateTime).to.contain(' content="2020-08-29T12:03:18+01:00"');
                            expect(bcDateTime).to.contain(' content="-2020-08-29T12:03:18Z"');
                        });
                    });

                    describe('when passed not in Schema acceptable ISO 8601 format', () => {
                        it('should not accept such value', () => {
                            const buildPath = path.resolve(tempDir.name, testBuildFolder);

                            buildModules({ buildPath, schemaData });

                            return importBuiltModules({ buildPath, schemaData }).then((resolvedModules) => {
                                const MediaObject = resolvedModules.find(
                                    (module) => getSchemaName(module) === 'MediaObject'
                                );
                                const DataType = resolvedModules.find((module) => getSchemaName(module) === 'DataType');

                                expect(() => MediaObject.startTime(DataType.dateTime('2020-27-05'))).to.throw(
                                    `Date in [-]CCYY-MM-DDThh:mm:ss[Z|(+|-)hh:mm] format expected. 2020-27-05 passed.`
                                );
                            });
                        });
                    });
                });

                describe("when DateTime is passed as a Date (JavaScript's) instance", () => {
                    it("should return DateTime value as is in 'content' attribute", () => {
                        const buildPath = path.resolve(tempDir.name, testBuildFolder);

                        buildModules({ buildPath, schemaData });

                        return importBuiltModules({ buildPath, schemaData }).then((resolvedModules) => {
                            const MediaObject = resolvedModules.find(
                                (module) => getSchemaName(module) === 'MediaObject'
                            );
                            const DataType = resolvedModules.find((module) => getSchemaName(module) === 'DataType');
                            const date = new Date(Date.UTC(2020, 5, 13, 12, 13, 14));

                            const result = MediaObject.startTime(DataType.dateTime(date));

                            expect(result).to.contain(` content="2020-06-13T12:13:14Z"`);
                        });
                    });
                });

                describe('when Date is any other value', () => {
                    it('should not accept such value', () => {
                        const buildPath = path.resolve(tempDir.name, testBuildFolder);

                        buildModules({ buildPath, schemaData });

                        return importBuiltModules({ buildPath, schemaData }).then((resolvedModules) => {
                            const MediaObject = resolvedModules.find(
                                (module) => getSchemaName(module) === 'MediaObject'
                            );
                            const DataType = resolvedModules.find((module) => getSchemaName(module) === 'DataType');

                            expect(() => MediaObject.uploadDate(DataType.dateTime(true))).to.throw(
                                "String or Date instance value expected. 'boolean' (true) passed."
                            );
                        });
                    });
                });
            });

            describe('when called with a Time data type Schema', () => {
                describe('when Time is passed as string', () => {
                    it("should return Time value as is in 'content' attribute", () => {
                        const buildPath = path.resolve(tempDir.name, testBuildFolder);

                        buildModules({ buildPath, schemaData });

                        return importBuiltModules({ buildPath, schemaData }).then((resolvedModules) => {
                            const MediaObject = resolvedModules.find(
                                (module) => getSchemaName(module) === 'MediaObject'
                            );
                            const DataType = resolvedModules.find((module) => getSchemaName(module) === 'DataType');

                            const simpleTime = MediaObject.startTime(DataType.time('12:03:18'));
                            const zoneTime = MediaObject.startTime(DataType.time('12:03:18Z'));
                            const shiftedTime = MediaObject.startTime(DataType.time('12:03:18+01:00'));

                            expect(simpleTime).to.contain(' content="12:03:18"');
                            expect(zoneTime).to.contain(' content="12:03:18Z"');
                            expect(shiftedTime).to.contain(' content="12:03:18+01:00"');
                        });
                    });

                    describe('when passed not in Schema acceptable format', () => {
                        it('should not accept such value', () => {
                            const buildPath = path.resolve(tempDir.name, testBuildFolder);

                            buildModules({ buildPath, schemaData });

                            return importBuiltModules({ buildPath, schemaData }).then((resolvedModules) => {
                                const MediaObject = resolvedModules.find(
                                    (module) => getSchemaName(module) === 'MediaObject'
                                );
                                const DataType = resolvedModules.find((module) => getSchemaName(module) === 'DataType');

                                expect(() => MediaObject.startTime(DataType.time('15:00'))).to.throw(
                                    `Time in hh:mm:ss[Z|(+|-)hh:mm] format expected. 15:00 passed.`
                                );
                            });
                        });
                    });
                });

                describe("when Time is passed as a Date (JavaScript's) instance", () => {
                    it("should return Time value as is in 'content' attribute", () => {
                        const buildPath = path.resolve(tempDir.name, testBuildFolder);

                        buildModules({ buildPath, schemaData });

                        return importBuiltModules({ buildPath, schemaData }).then((resolvedModules) => {
                            const MediaObject = resolvedModules.find(
                                (module) => getSchemaName(module) === 'MediaObject'
                            );
                            const DataType = resolvedModules.find((module) => getSchemaName(module) === 'DataType');
                            const date = new Date(Date.UTC(2020, 5, 13, 12, 13, 14));

                            const result = MediaObject.startTime(DataType.time(date));

                            expect(result).to.contain(` content="12:13:14Z"`);
                        });
                    });
                });

                describe('when Time is any other value', () => {
                    it('should not accept such value', () => {
                        const buildPath = path.resolve(tempDir.name, testBuildFolder);

                        buildModules({ buildPath, schemaData });

                        return importBuiltModules({ buildPath, schemaData }).then((resolvedModules) => {
                            const MediaObject = resolvedModules.find(
                                (module) => getSchemaName(module) === 'MediaObject'
                            );
                            const DataType = resolvedModules.find((module) => getSchemaName(module) === 'DataType');

                            expect(() => MediaObject.uploadDate(DataType.time(true))).to.throw(
                                "String or Date instance value expected. 'boolean' (true) passed."
                            );
                        });
                    });
                });
            });
        });
    });
});
