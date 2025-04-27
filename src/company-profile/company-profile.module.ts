import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CompanyProfileController } from './company-profile.controller';
import { CompanyProfileService } from './company-profile.service';
import { CompanyProfile, CompanyProfileSchema } from './schemas/company-profile.schema';
import { AuthModule } from '../auth/auth.module';
import { BuyersModule } from '../buyers/buyers.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: CompanyProfile.name, schema: CompanyProfileSchema }]),
    AuthModule,
    BuyersModule,
  ],
  controllers: [CompanyProfileController],
  providers: [CompanyProfileService],
  exports: [CompanyProfileService],
})
export class CompanyProfileModule { }