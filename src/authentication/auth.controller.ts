import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserDtoSignUp } from 'src/user/user-dto.signup';
import { UserDtoSignin } from 'src/user/user-dto.signin';

@Controller('auth')
export class AuthController {

    constructor(
        private readonly authService: AuthService
    ) {}

    @Post('signup')
    async signUp(@Body() input: UserDtoSignUp): Promise<any> {
        return await this.authService.signUp(input);
    }

    @Post('signin')
    async signIn(@Body() input: UserDtoSignin): Promise<any> {
        return await this.authService.signIn(input);
    }

}
