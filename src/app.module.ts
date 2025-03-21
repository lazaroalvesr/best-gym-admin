import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { mailerConfig } from './lib/mailer.config';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Module({
  imports: [
    MailerModule.forRoot(mailerConfig),
    PrismaModule, PrismaModule, AuthModule],
  controllers: [AppController],
  providers: [{
    provide: AppService,
    useClass: JwtAuthGuard
  }],
})
export class AppModule { }
