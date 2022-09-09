import { Test } from '@nestjs/testing';
import { ArgumentMetadata } from '@nestjs/common';
import { AuthPipe } from '../auth.pipe';

describe('AuthPipe', () => {
    let service: AuthPipe;

    beforeEach(async () => {
        jest.clearAllMocks();
        const module = await Test.createTestingModule({
            providers: [AuthPipe],
        }).compile();

        service = await module.resolve(AuthPipe);
    });

    describe('transform', () => {
        describe('when metadata is valid', () => {
            it('should pass pipe', async () => {
                // Arrange
                const metadata: ArgumentMetadata = {
                    type: 'body',
                    metatype: String,
                    data: 'abc',
                };
                jest.spyOn(service, 'toValidate').mockResolvedValueOnce(true);

                // Act
                const actualValue = await service.transform(metadata.data, metadata);

                // Assert
                expect(actualValue).toEqual(metadata.data);
            });
        });
    });

    describe('toValidate', () => {
        const testCases = [String, Boolean, Number, Array, Object];
        describe.each(testCases)('when input is defined type', (data) => {
            it('should valid success.', async () => {
                // Act
                const actualValue = service.toValidate(data);

                // Assert
                expect(actualValue).toBeTruthy();
            });
        });
    });
});
