import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { SignupDto } from './dtos/signup.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
import mongoose, { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dtos/login.dto';
import { JwtService } from '@nestjs/jwt';
import { RefreshToken } from './schemas/refresh-token.schema';
import { v4 as uuidv4 } from 'uuid';
import { nanoid } from 'nanoid';
import { ResetToken } from './schemas/reset-token.schema';
import { MailService } from 'src/services/mail.service';
import { UpdateUserDto } from './dtos/update-user.dto';
import { ChildProfile } from 'src/child-profile/schemas/child-profile.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private UserModel: Model<User>,
    @InjectModel(RefreshToken.name)
    private RefreshTokenModel: Model<RefreshToken>,
    @InjectModel(ResetToken.name)
    private ResetTokenModel: Model<ResetToken>,
    private jwtService: JwtService,
    private mailService: MailService,
    @InjectModel(ChildProfile.name)
private ChildModel: Model<ChildProfile>
  ) {}

  async signup(data: SignupDto) {
    const { email, password, name } = data;
  
    if (await this.UserModel.findOne({ email }))
      throw new BadRequestException('Email already in use');
  
    const hashed = await bcrypt.hash(password, 10);
    const verificationToken = nanoid(64);
    const expiry = new Date(Date.now() + 60 * 60 * 1000);        // 1 h
  
    const user = await this.UserModel.create({
      name,
      email,
      password: hashed,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: expiry,   // (facultatif, si tu ajoutes un champ)
    });
  
    await this.mailService.sendWelcomeEmail(email, name);
    await this.mailService.sendEmailVerification(email, verificationToken, name);
  
    return { message: 'Compte créé. Vérifiez votre e-mail pour l’activer.' };
  }

  async login({ email, password }: LoginDto) {
    const user = await this.UserModel.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password)))
      throw new UnauthorizedException('Wrong credentials');
  
    if (!user.isEmailVerified)
      throw new UnauthorizedException('Veuillez confirmer votre adresse e-mail.');
  
    const tokens = await this.generateUserTokens(user._id);
    return { ...tokens, userId: user._id };
  }

  async changePassword(userId, oldPassword: string, newPassword: string) {
    //Find the user
    const user = await this.UserModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found...');
    }

    //Compare the old password with the password in DB
    const passwordMatch = await bcrypt.compare(oldPassword, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Wrong credentials');
    }

    //Change user's password
    const newHashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = newHashedPassword;
    await user.save();
  }

  async verifyEmail(token: string) {
    const user = await this.UserModel.findOne({ emailVerificationToken: token });
  
    if (!user) {
      throw new NotFoundException('Lien invalide ou expiré.');
    }
  
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined; // facultatif : on peut supprimer le token après usage
    await user.save();
  
    return { message: 'Adresse e-mail confirmée. Vous pouvez vous connecter.' };
  }

  async forgotPassword(email: string) {
    //Check that user exists
    const user = await this.UserModel.findOne({ email });

    if (user) {
      //If user exists, generate password reset link
      const expiryDate = new Date();
      expiryDate.setHours(expiryDate.getHours() + 1);

      const resetToken = nanoid(64);
      await this.ResetTokenModel.create({
        token: resetToken,
        userId: user._id,
        expiryDate,
      });
      //Send the link to the user by email
      this.mailService.sendPasswordResetEmail(email, resetToken);
    }

    return { message: 'If this user exists, they will receive an email' };
  }

  async resetPassword(newPassword: string, resetToken: string) {
    //Find a valid reset token document
    const token = await this.ResetTokenModel.findOneAndDelete({
      token: resetToken,
      expiryDate: { $gte: new Date() },
    });

    if (!token) {
      throw new UnauthorizedException('Invalid link');
    }

    //Change user password (MAKE SURE TO HASH!!)
    const user = await this.UserModel.findById(token.userId);
    if (!user) {
      throw new InternalServerErrorException();
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
  }

  async refreshTokens(refreshToken: string) {
    const token = await this.RefreshTokenModel.findOne({
      token: refreshToken,
      expiryDate: { $gte: new Date() },
    });

    if (!token) {
      throw new UnauthorizedException('Refresh Token is invalid');
    }
    return this.generateUserTokens(token.userId);
  }

  async generateUserTokens(userId) {
    const accessToken = this.jwtService.sign({ userId }, { expiresIn: '10h' });
    const refreshToken = uuidv4();

    await this.storeRefreshToken(refreshToken, userId);
    return {
      accessToken,
      refreshToken,
    };
  }

  async storeRefreshToken(token: string, userId: string) {
    // Calculate expiry date 3 days from now
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 3);

    await this.RefreshTokenModel.updateOne(
      { userId },
      { $set: { expiryDate, token } },
      {
        upsert: true,
      },
    );
  }

  async updateUser(userId: string, dto: UpdateUserDto) {
    const user = await this.UserModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');
  
    // Si email à modifier → vérifier l’unicité
    if (dto.email && dto.email !== user.email) {
      const exists = await this.UserModel.findOne({ email: dto.email });
      if (exists) throw new BadRequestException('Email already in use');
      user.email = dto.email;
    }
  
    if (dto.name) user.name = dto.name;
  
    await user.save();
    return user;        
  }
  

  async logout(refreshToken: string) {
    const deleted = await this.RefreshTokenModel.deleteOne({ token: refreshToken });
  
    if (deleted.deletedCount === 0) {
      throw new UnauthorizedException('Invalid token');
    }
  
    return { message: 'Logged out successfully' };
  }

  async deleteUserAccount(userId: string) {
    // 1. Supprimer les enfants liés
    await this.ChildModel.deleteMany({ parent: userId });
  
    // 2. Supprimer les tokens liés
    await this.RefreshTokenModel.deleteMany({ userId });
  
    // 3. Supprimer l'utilisateur
    await this.UserModel.findByIdAndDelete(userId);
  
    return { message: 'Compte supprimé avec succès' };
  }
}
