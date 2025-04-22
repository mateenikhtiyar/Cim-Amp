import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { BuyersController } from './buyers.controller';
import { BuyersService } from './buyers.service';
import { Buyer, BuyerSchema } from './schemas/buyer.schema';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Buyer.name, schema: BuyerSchema }]),
    MulterModule.register({ dest: './uploads' }),
    forwardRef(() => AuthModule), // ✅ Fix circular dependency here too
  ],
  controllers: [BuyersController],
  providers: [BuyersService],
  exports: [BuyersService],
})
export class BuyersModule { }
