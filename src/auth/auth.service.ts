import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { BuyersService } from '../buyers/buyers.service';
import { LoginBuyerDto } from '../buyers/dto/login-buyer.dto';

@Injectable()
export class AuthService {
  constructor(
    private buyersService: BuyersService,
    private jwtService: JwtService,
  ) { }

  async validateBuyer(email: string, password: string): Promise<any> {
    const buyer = await this.buyersService.findByEmail(email);
    if (buyer && await bcrypt.compare(password, buyer.password)) {
      // Handle both Mongoose document and plain object
      const result = buyer.toObject ? buyer.toObject() : { ...buyer };
      delete result.password;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user._id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        companyName: user.companyName,
        profilePicture: user.profilePicture,
        role: user.role,
      }
    };
  }

  async loginWithGoogle(profile: any) {
    const buyer = await this.buyersService.createFromGoogle(profile);
    return this.login(buyer);
  }
}