import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Module({
  providers: [PrismaService],
  controllers: [PrismaService]
})
export class PrismaModule {}
