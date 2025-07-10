import { Body, Controller, HttpStatus, Post } from '@nestjs/common';
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
        const result = await this.authService.signUp(input);
        if(!result) return HttpStatus.BAD_REQUEST;
        return {
            status: HttpStatus.CREATED,
            message: 'User created successfully',
            data: result
        }
    }

    @Post('signin')
    async signIn(@Body() input: UserDtoSignin): Promise<any> {
        const result = await this.authService.signIn(input);
        
        if(!result) return HttpStatus.BAD_REQUEST;
        console.log(result);

        return {
            status: HttpStatus.OK,
            message: 'Login successful',
            data: result
        }


    }

}
