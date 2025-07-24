import { Controller, Get } from '@nestjs/common';

@Controller('user')
export class UserController {
    constructor() {}

    @Get('profile')
    async profile() {
        return 'profile';
    }
}
