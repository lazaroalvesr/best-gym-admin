import { Controller, Get, UseGuards } from '@nestjs/common';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { Role } from '../enums/role.enum';

@Controller('admin')
@UseGuards(RolesGuard)
export class AdminController {

    @Get('admin-dashboard')
    @Roles(Role.ADMIN)
    getAdminDashboard(@CurrentUser() user) {
        return { message: 'Painel do administrador' };
    }

    @Get('employee-dashboard')
    @Roles(Role.EMPLOYEE, Role.ADMIN)
    getEmployeeDashboard(@CurrentUser() user) {
        return { message: 'Painel do funcionário' };
    }
}
