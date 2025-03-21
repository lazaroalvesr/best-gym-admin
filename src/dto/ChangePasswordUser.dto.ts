import { IsNotEmpty, IsString } from "class-validator";

export class ChangePassworUserdDTO {

    @IsString()
    @IsNotEmpty()
    password: string

    @IsString()
    @IsNotEmpty()
    passwordConfirmation: string
}