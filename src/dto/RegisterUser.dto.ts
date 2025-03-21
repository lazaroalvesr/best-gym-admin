import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from "class-validator"
import { Role } from "../enums/role.enum"

export class RegisterUserDTO {

    @IsString()
    name: string

    @IsEmail()
    email: string

    @IsString()
    @MinLength(6)
    password: string

    @IsOptional()
    @IsString()
    cpf?: string

    @IsEnum(Role)
    @IsOptional()
    role?: Role

    @IsOptional()
    @IsString()
    planId: string

}