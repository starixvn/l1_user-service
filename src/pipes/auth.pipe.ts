import { Injectable, PipeTransform, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';

@Injectable()
export class AuthPipe implements PipeTransform<any> {
    async transform(value: any, { metatype }: ArgumentMetadata) {
        if (!metatype || this.toValidate(metatype)) {
            return value;
        }
        const object = plainToClass(metatype, value);
        const errors = await validate(object);
        if (errors.length > 0) {
            throw new BadRequestException('Validation failed');
        }
        return value;
    }

    toValidate(metatype: Function): any {
        const types: Function[] = [String, Boolean, Number, Array, Object];
        return types.includes(metatype);
    }
}
