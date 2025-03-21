import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUserDTO } from '../dto/RegisterUser.dto';
import { LoginUserDTO } from '../dto/LoginUser.dto';
import { Public } from '../decorators/public-auth.decorator';
import { ChangePassworUserdDTO } from '../dto/ChangePasswordUser.dto';
import { UpdateUserDTO } from '../dto/UpdateUser.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { SearchUserDTO } from '../dto/SearchUser.dto';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post("create")
    async create(@Body() body: RegisterUserDTO) {
        return this.authService.create(body);
    }

    @Post("login")
    async login(@Body() body: LoginUserDTO) {
        return this.authService.login(body)
    }

    @Patch(":token")
    @Public()
    async confirmEmail(@Param("token") token: string) {
        await this.authService.confirmationEmail(token)
        return { message: "Email confirmado" }
    }

    @Post("send-recover-email")
    @Public()
    async sendRecoverEmail(@Body("email") email: string) {
        await this.authService.sendPasswordResetEmailService(email);
        return { message: "Foi enviado um email com instruções para resetar sua senha." }
    }

    @Patch("reset-password/:token")
    @Public()
    async resetPassword(@Param("token") token: string, @Body(ValidationPipe) changePassword: ChangePassworUserdDTO) {
        await this.authService.resetPassword(token, changePassword);
        return { message: "Senha alterada com sucesso." }
    }

    @Get("getById/:id")
    @UseGuards(JwtAuthGuard)
    async getById(@Param("id") id: string) {
        return await this.authService.getUserById(id)
    }

    @Patch("edit/:id")
    @UseGuards(JwtAuthGuard)
    async editInfo(@Param("id") id: string, @Body() updateUser: UpdateUserDTO) {
        return await this.authService.updateUser(id, updateUser)
    }

    @Get("all")
    @UseGuards(JwtAuthGuard)
    @UsePipes(new ValidationPipe({ transform: true }))
    async allAndSearch(@Query() filters: SearchUserDTO) {
        return await this.authService.searchUser(filters)
    }

    @Delete("delete/:id")
    @UseGuards(JwtAuthGuard)
    async delete(@Param("id") id: string) {
        return await this.authService.deleteUser(id);
    }
}
