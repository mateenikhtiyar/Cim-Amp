import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { BuyersModule } from './buyers/buyers.module';
import { AuthModule } from './auth/auth.module';
import { CompanyProfileModule } from './company-profile/company-profile.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost/e-commerce'),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    BuyersModule,
    AuthModule,
    CompanyProfileModule,
  ],
})
export class AppModule { }