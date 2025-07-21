import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ChildProfileController } from './child-profile.controller';
import { ChildProfileService } from './child-profile.service';
import { ChildProfile, ChildProfileSchema } from './schemas/child-profile.schema';
import { User, UserSchema } from 'src/auth/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ChildProfile.name, schema: ChildProfileSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [ChildProfileController],
  providers: [ChildProfileService],
})
export class ChildProfileModule {}