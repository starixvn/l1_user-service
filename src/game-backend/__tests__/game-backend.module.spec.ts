import { GameBackendModule } from '../index';

describe('ValidationPipe test', () => {
    it('should return sign in game result', () => {
        // Act
        const module = new GameBackendModule();

        // Assert
        expect(module).not.toBeNull();
    });
});
