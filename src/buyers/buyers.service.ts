import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Buyer, BuyerDocument } from './schemas/buyer.schema';
import { CreateBuyerDto } from './dto/create-buyer.dto';

@Injectable()
export class BuyersService {
  constructor(
    @InjectModel(Buyer.name) private buyerModel: Model<BuyerDocument>,
  ) { }

  async create(createBuyerDto: CreateBuyerDto): Promise<Buyer> {
    const { email, password } = createBuyerDto;

    // Check if buyer already exists
    const existingBuyer = await this.buyerModel.findOne({ email }).exec();
    if (existingBuyer) {
      throw new ConflictException('Email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new buyer
    const newBuyer = new this.buyerModel({
      ...createBuyerDto,
      password: hashedPassword,
    });

    return newBuyer.save();
  }

  async findByEmail(email: string): Promise<Buyer> {
    const buyer = await this.buyerModel.findOne({ email }).exec();
    if (!buyer) {
      throw new NotFoundException('Buyer not found');
    }
    return buyer;
  }

  async findById(id: string): Promise<Buyer> {
    const buyer = await this.buyerModel.findById(id).exec();
    if (!buyer) {
      throw new NotFoundException('Buyer not found');
    }
    return buyer;
  }

  async createFromGoogle(profile: any): Promise<Buyer> {
    const { email, name, sub } = profile;

    // Check if user already exists
    let buyer = await this.buyerModel.findOne({ email }).exec();

    if (buyer) {
      // Update Google ID if not already set
      if (!buyer.googleId) {
        buyer.googleId = sub;
        buyer.isGoogleAccount = true;
        return buyer.save();
      }
      return buyer;
    }

    // Create new buyer from Google data
    const newBuyer = new this.buyerModel({
      email,
      fullName: name,
      companyName: 'Set your company name',  // Default value, user can update later
      password: await bcrypt.hash(Math.random().toString(36), 10), // Random password
      googleId: sub,
      isGoogleAccount: true,
    });

    return newBuyer.save();
  }

  async updateProfilePicture(id: string, profilePicturePath: string): Promise<Buyer> {
    const buyer = await this.buyerModel.findById(id).exec();
    if (!buyer) {
      throw new NotFoundException('Buyer not found');
    }

    buyer.profilePicture = profilePicturePath;
    return buyer.save();
  }
}