import { ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { ValidationPipe } from '../validation-pipe';
import { SignInGameRequest } from '../models';

describe('ValidationPipe test', () => {
    let validationPipe: ValidationPipe;
    beforeEach(async () => {
        validationPipe = new ValidationPipe();
    });

    describe('transform', () => {
        describe('when not have metatype', () => {
            it('should return original value', async () => {
                // Arrange
                const value = {};
                const metatype = { metatype: null } as ArgumentMetadata;

                // Act
                const actualValue = await validationPipe.transform(value, metatype);

                // Assert
                expect(actualValue).toStrictEqual(value);
            });
        });

        describe('when value is invalid', () => {
            it('should return original value', async () => {
                // Arrange
                const value = {};
                const metatype = { metatype: ValidationPipe } as ArgumentMetadata;

                // Act
                const actualValue = await validationPipe.transform(value, metatype);

                // Assert
                expect(actualValue).toStrictEqual(value);
            });
        });

        describe('when have errors', () => {
            it('should throw BadRequestException', async () => {
                // Arrange
                const value = {} as SignInGameRequest;
                const metatype = { metatype: SignInGameRequest, type: 'body' } as ArgumentMetadata;

                // Assert
                expect(async () => validationPipe.transform(value, metatype)).rejects.toBeInstanceOf(BadRequestException);
            });
        });

        describe('when not have errors', () => {
            it('should return original value', async () => {
                // Arrange
                const value = { session: 'session', username: 'username', browserUserAgent: 'browserUserAgent' } as SignInGameRequest;
                const metatype = { metatype: SignInGameRequest, type: 'body' } as ArgumentMetadata;

                // Act
                const actualValue = await validationPipe.transform(value, metatype);

                // Assert
                expect(actualValue).toStrictEqual(value);
            });
        });
    });
});
