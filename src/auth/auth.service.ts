import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { BuyersService } from '../buyers/buyers.service';
import { LoginBuyerDto } from '../buyers/dto/login-buyer.dto';
import { GoogleLoginResult } from "./interfaces/google-login-result.interface"
import { Buyer } from "../buyers/schemas/buyer.schema"

@Injectable()
export class AuthService {
  constructor(
    private buyersService: BuyersService,
    private jwtService: JwtService,
  ) { }

  async validateBuyer(email: string, password: string): Promise<any> {
    const buyer = await this.buyersService.findByEmail(email);
    if (buyer && await bcrypt.compare(password, buyer.password)) {
      const result = buyer.toObject ? buyer.toObject() : { ...buyer };
      delete result.password;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user._id, role: user.role || 'buyer' };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        companyName: user.companyName,
        profilePicture: user.profilePicture,
        role: user.role || 'buyer',
      }
    };
  }

  async loginWithGoogle(googleUser: any): Promise<GoogleLoginResult> {
    const { buyer, isNewUser } = await this.buyersService.createFromGoogle(googleUser);

    console.log('Buyer from service:', JSON.stringify(buyer, null, 2));


    const buyerId = (buyer as any)._id?.toString() ||
      (buyer as any).id?.toString() ||
      null;

    if (!buyerId) {
      console.error('No ID found in buyer object:', buyer);
      throw new Error('Failed to get user ID from buyer object');
    }

    const payload = {
      email: buyer.email,
      sub: buyerId,
      role: (buyer as any).role || 'buyer'
    };

    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
      isNewUser,
      user: {
        ...buyer as any,
        _id: buyerId
      }
    };
  }
}