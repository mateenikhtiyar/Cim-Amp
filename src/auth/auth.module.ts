// In auth.module.ts

import { Module, forwardRef, Logger } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { BuyersModule } from '../buyers/buyers.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';

@Module({
  imports: [
    forwardRef(() => BuyersModule),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    GoogleStrategy,
    {
      provide: 'LOGGER',
      useFactory: () => {
        const logger = new Logger('AuthModule');
        logger.log(`JWT Module initialized with secret: ${(process.env.JWT_SECRET || 'your-secret-key').substring(0, 3)}...`);
        return logger;
      }
    }
  ],
  exports: [AuthService],
})
export class AuthModule { }