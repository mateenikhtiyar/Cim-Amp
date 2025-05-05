import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Request,
  UseInterceptors,
  UploadedFile,
  Param,
  Res
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { BuyersService } from './buyers.service';
import { CreateBuyerDto } from './dto/create-buyer.dto';
import { LocalAuthGuard } from '../auth/guards/local-auth.guard';
import { GoogleAuthGuard } from '../auth/guards/google-auth.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthService } from '../auth/auth.service';
import { LoginBuyerDto } from './dto/login-buyer.dto';
import { Buyer } from './schemas/buyer.schema';
import { GoogleLoginResult } from "../auth/interfaces/google-login-result.interface"

import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiConsumes,
  ApiBody
} from '@nestjs/swagger';

interface RequestWithUser extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}


@ApiTags('buyers')
@Controller('buyers')
export class BuyersController {
  constructor(
    private readonly buyersService: BuyersService,
    private readonly authService: AuthService,
  ) { }

  @Post('register')
  @ApiOperation({ summary: 'Register a new buyer' })
  @ApiResponse({ status: 201, description: 'Buyer successfully registered' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async register(@Body() createBuyerDto: CreateBuyerDto) {
    const buyer = await this.buyersService.create(createBuyerDto);
    // Safely handle toObject
    const result = buyer.toObject ? buyer.toObject() : { ...buyer };
    delete result.password;
    return result;
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @ApiOperation({ summary: 'Login a buyer' })
  @ApiResponse({ status: 200, description: 'Buyer successfully logged in' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBody({ type: LoginBuyerDto })
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  @ApiResponse({ status: 302, description: 'Redirects to Google OAuth' })
  googleAuth() {
    // This route initiates Google OAuth flow
  }


  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Google OAuth callback' })
  @ApiResponse({ status: 302, description: 'Redirects to frontend with token' })
  async googleAuthCallback(@Request() req, @Res() res) {
    try {
      if (!req.user) {
        const frontendUrl = process.env.FRONTEND_URL;
        return res.redirect(`${frontendUrl}/auth/error?message=Authentication failed`);
      }

      const loginResult = await this.authService.loginWithGoogle(req.user) as GoogleLoginResult;

      // Debug what's actually being returned
      console.log('Login result:', JSON.stringify(loginResult, null, 2));
      console.log('User ID type:', typeof loginResult.user._id);
      console.log('User ID value:', loginResult.user._id);

      const frontendUrl = process.env.FRONTEND_URL;
      const redirectPath = loginResult.isNewUser ? '/acquireprofile' : '/deals';

      // Use a fallback if _id is undefined
      const userId = loginResult.user._id ||
        (loginResult.user as any).id ||
        'missing-id';

      const redirectUrl = `${frontendUrl}${redirectPath}?token=${loginResult.access_token}&userId=${userId}`;

      console.log('Redirect URL:', redirectUrl);
      return res.redirect(redirectUrl);
    } catch (error) {
      console.error('Google callback error:', error);
      const frontendUrl = process.env.FRONTEND_URL;
      return res.redirect(`${frontendUrl}/auth/error?message=${encodeURIComponent(error.message)}`);
    }
  }
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get buyer profile' })
  @ApiResponse({ status: 200, description: 'Buyer profile returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getProfile(@Request() req) {
    return this.buyersService.findById(req.user?.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('upload-profile-picture')
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload profile picture' })
  @ApiResponse({ status: 200, description: 'Profile picture uploaded successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/profile-pictures',
        filename: (req: any, file, cb) => {
          // Type cast req as any to access user property safely
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          const userId = req.user?.userId || 'unknown';
          cb(null, `${userId}${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
          return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 1024 * 1024 * 5, // 5MB limit
      },
    }),
  )
  async uploadProfilePicture(@Request() req, @UploadedFile() file) {
    const profilePicturePath = file.path;
    const buyer = await this.buyersService.updateProfilePicture(
      req.user?.userId,
      profilePicturePath,
    );
    return { message: 'Profile picture uploaded successfully', profilePicture: profilePicturePath };
  }
}
