import { Type } from 'class-transformer';
import { IsString, IsNotEmpty, IsArray, IsObject, ValidateNested, IsNumber } from 'class-validator';

class UpdateFieldDto {
  @IsString()
  @IsNotEmpty()
  public name: string;

  @IsNotEmpty()
  public value: any;
}

export class UpdateActionDto {
  @IsArray()
  @IsNotEmpty({ each: true })
  public ids: Array<string>;

  @IsObject()
  @ValidateNested()
  @Type(() => UpdateFieldDto)
  public field: UpdateFieldDto;
}

export class DeleteActionDto {
  @IsArray()
  @IsNotEmpty({ each: true })
  public ids: Array<string>;
}
