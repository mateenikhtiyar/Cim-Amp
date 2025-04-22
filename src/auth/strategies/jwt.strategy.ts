import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { BuyersService } from '../../buyers/buyers.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private buyersService: BuyersService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: process.env.JWT_SECRET || 'your-secret-key', // Use env variable in production
        });
    }

    async validate(payload: any) {
        const buyer = await this.buyersService.findById(payload.sub);
        return { userId: payload.sub, email: payload.email, role: payload.role };
    }
}