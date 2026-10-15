import { registerDecorator, ValidationOptions } from 'class-validator';

export function IsValidDate(validationOption: ValidationOptions) {
  const currentDate = new Date();

  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isPastDate',
      target: object.constructor,
      propertyName,
      options: validationOption,
      validator: {
        validate(value: any) {
          return (
            value instanceof Date &&
            currentDate.getFullYear() - value.getFullYear() > 15
          );
        },
      },
    });
  };
}
