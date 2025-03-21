import { BadRequestException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginUserDTO } from '../dto/LoginUser.dto';
import * as bcrypt from 'bcryptjs';
import { RegisterUserDTO } from '../dto/RegisterUser.dto';
import { Role } from '../enums/role.enum';
import { UpdateUserDTO } from '../dto/UpdateUser.dto';
import { v4 as uuidv4 } from 'uuid';
import { MailerService } from '@nestjs-modules/mailer';
import { ChangePassworUserdDTO } from '../dto/ChangePasswordUser.dto';
import { SearchUserDTO } from '../dto/SearchUser.dto';

@Injectable()
export class AuthService {
    constructor(
        private jwtService: JwtService,
        private readonly prismaService: PrismaService,
        private mailerService: MailerService
    ) { }

    async login({ email, password }: LoginUserDTO) {
        try {
            const user = await this.prismaService.user.findFirst({
                where: {
                    email,
                }
            })

            if (!user) {
                throw new BadRequestException('Email ou senha inválido.')
            }

            const passwordMatch = await bcrypt.compare(password, user.password);
            if (!passwordMatch) {
                throw new BadRequestException('Email ou senha estão inválidos!')
            }

            const { password: _, ...userSemSenha } = user;
            const payload = { sub: user.id, username: user.name, role: user.role };

            const acess_token = await this.jwtService.signAsync(payload);

            return { user: userSemSenha, acess_token };
        } catch (error) {
            throw new BadRequestException('Email ou senha inválidos');
        }
    }

    async create({ name, email, password, cpf, role, planId }: RegisterUserDTO) {
        const existingUser = await this.prismaService.user.findUnique({
            where: { email }
        })

        if (existingUser) {
            throw new BadRequestException('Email inválido ou já esta em uso!')
        }

        const confirmationToken = uuidv4();
        const hashedPassword = await bcrypt.hash(password, 10)

        const user = await this.prismaService.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                cpf: cpf || Role.CUSTOMER,
                role,
                planId,
                confirmationToken,
            }
        })
        const emailData = {
            to: user.email,
            from: 'noreply@bestgym.com',
            subject: 'Confirmação de cadastro - BestGym',
            template: 'account-verification',
            context: {
                verificationToken: user.confirmationToken
            }
        };


        await this.mailerService.sendMail(emailData);

        const { password: _, ...userWithoutPassword } = user;

        const acessToken = await this.jwtService.signAsync(userWithoutPassword);

        return { user: userWithoutPassword, access_token: acessToken }

    }

    async getUserById(id: string) {
        const response = await this.prismaService.user.findFirst({
            where: { id },
            include: {
                Checkin: true,
                Payment: true,
                plan: true,
            }
        })

        return response
    }

    async confirmationEmail(confirmationToken: string) {
        const user = await this.prismaService.user.findFirst({
            where: { confirmationToken }
        })

        if (!user) {
            throw new NotFoundException("Token inválido!")
        }

        const updateUser = await this.prismaService.user.update({
            where: { id: user.id },
            data: {
                confirmationToken
            }
        })
    }

    async updateUser(id: string, userUpdate: UpdateUserDTO) {
        try {
            const update = await this.prismaService.user.update({
                where: { id },
                data: {
                    name: userUpdate.name,
                    email: userUpdate.email,
                    cpf: userUpdate.cpf,
                    planId: userUpdate.planId
                }
            })

            const payload = { ...update };

            const acess_token = await this.jwtService.signAsync(payload);

            return { user: payload, token: acess_token };
        } catch (error) {
            throw new BadRequestException('Erro ao atualizar as informações do usuário!')
        }
    }

    async sendPasswordResetEmailService(email: string) {
        const user = await this.prismaService.user.findUnique({
            where: { email }
        })

        if (!user) {
            throw new NotFoundException("Não existe ninguem cadastrado com esse email.")
        }

        const resetToken = uuidv4();

        await this.prismaService.user.update({
            where: { id: user.id },
            data: {
                recoverToken: resetToken
            }
        })

        const emailData = {
            to: user.email,
            from: 'noreply@bestgym.com',
            subject: 'Solicitação de redefinição de senha',
            template: 'reset-password',
            context: {
                userName: user.name,
                resetToken: resetToken
            },
        };

        await this.mailerService.sendMail(emailData)
    }

    async changePassword(id: string, changePassword: ChangePassworUserdDTO) {
        const { password, passwordConfirmation } = changePassword

        if (password !== passwordConfirmation) {
            throw new UnprocessableEntityException("As senhas não correspondem!")
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await this.prismaService.user.update({
            where: { id },
            data: {
                password: hashedPassword
            }
        })
    }

    async resetPassword(recoverToken: string, changePassword: ChangePassworUserdDTO) {
        const { password, passwordConfirmation } = changePassword

        if (password !== passwordConfirmation) {
            throw new UnprocessableEntityException("As senhas não correspondem!")
        }

        const user = await this.prismaService.user.findFirst({
            where: { recoverToken },
            select: { id: true }
        })

        if (!user) {
            throw new NotFoundException('Parece que o link para redefinir a senha não é válido ou expirou. Por favor, solicite um novo link.');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await this.prismaService.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                recoverToken: null
            }
        })

        return { message: "Senha atualizada com sucesso!" }
    }

    async searchUser(filters: SearchUserDTO) {
        const whereConditions = filters.email
            ? {
                email: {
                    contains: filters.email,
                    mode: 'insensitive' as 'insensitive'
                }
            } : {}

        try {
            const [totalUsers, filteredUsers] = await Promise.all([
                this.prismaService.user.count(),
                this.prismaService.user.findMany({
                    where: whereConditions,
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        planId: true
                    }
                })
            ])

            return {
                count: totalUsers,
                user: filteredUsers
            }
        } catch (err) {
            console.error("Erro ao buscar usuários:", err);
            throw new Error("Erro ao buscar usuários no banco.");
        }
    }

    async deleteUser(id: string) {
        await this.prismaService.user.delete({
            where: { id }
        })

        return { message: "Usuário excluído com sucesso" }
    }
}
