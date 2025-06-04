import { Test } from '@nestjs/testing';
import { ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { AuthPipe } from '../auth.pipe';
import { IsNotEmpty, IsString } from 'class-validator';

describe('AuthPipe', () => {
    let service: AuthPipe;

    beforeEach(async () => {
        jest.clearAllMocks();
        const module = await Test.createTestingModule({
            providers: [AuthPipe],
        }).compile();

        service = module.get<AuthPipe>(AuthPipe);
    });

    describe('transform', () => {
        describe('when metadata is valid', () => {
            it('should pass pipe when metatype is a primitive type', async () => {
                // Arrange
                const testData = 'abc';
                const metadata: ArgumentMetadata = {
                    type: 'body',
                    metatype: String,
                };

                // Act
                const actualValue = await service.transform(testData, metadata);

                // Assert
                expect(actualValue).toEqual(testData);
            });

            it('should pass pipe when metatype is undefined', async () => {
                // Arrange
                const testData = { some: 'data' };
                const metadata: ArgumentMetadata = {
                    type: 'body',
                    metatype: undefined,
                };

                // Act
                const actualValue = await service.transform(testData, metadata);

                // Assert
                expect(actualValue).toEqual(testData);
            });

            it('should validate and transform DTO objects', async () => {
                // Arrange
                class TestDto {
                    @IsString()
                    @IsNotEmpty()
                    name: string;
                }
                const testData = { name: 'test' };
                const metadata: ArgumentMetadata = {
                    type: 'body',
                    metatype: TestDto,
                };

                // Act
                const actualValue = await service.transform(testData, metadata);

                // Assert
                expect(actualValue).toEqual(testData);
            });

            it('should throw BadRequestException when DTO validation fails', async () => {
                // Arrange
                class TestDto {
                    @IsString()
                    @IsNotEmpty()
                    name: string;
                }
                const testData = { name: '' };
                const metadata: ArgumentMetadata = {
                    type: 'body',
                    metatype: TestDto,
                };

                // Act & Assert
                await expect(service.transform(testData, metadata)).rejects.toThrow(BadRequestException);
            });
        });
    });

    describe('toValidate', () => {
        const testCases = [String, Boolean, Number, Array, Object];
        describe.each(testCases)('when input is defined type', (data) => {
            it('should return true for primitive types', () => {
                // Act
                const actualValue = service.toValidate(data);

                // Assert
                expect(actualValue).toBe(true);
            });
        });

        it('should return false for custom types', () => {
            // Arrange
            class CustomType {}

            // Act
            const actualValue = service.toValidate(CustomType);

            // Assert
            expect(actualValue).toBe(false);
        });
    });
});
