import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { ChildProfile } from './schemas/child-profile.schema';
import { CreateChildDto } from './dto/create-child-profile.dto';
import { User } from 'src/auth/schemas/user.schema';
import { UpdateChildDto } from './dto/update-child-profile.dto';

@Injectable()
export class ChildProfileService {
  constructor(
    @InjectModel(ChildProfile.name)
    private readonly childModel: Model<ChildProfile>,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) {}

  /** Crée un enfant et lie son _id au parent. */
  async create(dto: CreateChildDto, parentId: string) {
    // 1. parser date (DD-MM-YYYY)
    const [day, month, year] = dto.dateOfBirth.split('-').map(Number);
    const birthDate = new Date(year, month - 1, day); // mois 0-indexé
  
    // 2. calculer l’âge
    const today = new Date();
    let age =
      today.getFullYear() -
      birthDate.getFullYear() -
      (today.getMonth() < birthDate.getMonth() ||
      (today.getMonth() === birthDate.getMonth() &&
        today.getDate() < birthDate.getDate())
        ? 1
        : 0);
  
    // 3. validation
    if (age < 4 || age > 10) {
      throw new BadRequestException(
        "L'âge de l'enfant doit être entre 4 et 10 ans.",
      );
    }
  
    // 4. enregistrer uniquement name, dateOfBirth, avatar, parent
    const child = await new this.childModel({
      name: dto.name,
      dateOfBirth: birthDate,
      avatar: dto.avatar,
      parent: parentId,
    }).save();
  
    // 5. lier au parent
    await this.userModel.updateOne(
      { _id: parentId },
      { $push: { children: child._id } },
    );
  
    return child;
  }

  async findByParent(parentId: string) {
    return this.childModel.find({ parent: parentId });
  }

  async update(childId: string, dto: UpdateChildDto, parentId: string) {
    const child = await this.childModel.findOne({ _id: childId, parent: parentId });
    if (!child) {
      throw new BadRequestException("Enfant non trouvé ou accès interdit.");
    }
  
    // Si la date est fournie, on vérifie l’âge recalculé
    if (dto.dateOfBirth) {
      const [day, month, year] = dto.dateOfBirth.split('-').map(Number);
      const birthDate = new Date(year, month - 1, day);
  
      const today = new Date();
      let age =
        today.getFullYear() -
        birthDate.getFullYear() -
        (today.getMonth() < birthDate.getMonth() ||
        (today.getMonth() === birthDate.getMonth() &&
          today.getDate() < birthDate.getDate())
          ? 1
          : 0);
  
      if (age < 4 || age > 10) {
        throw new BadRequestException("L'âge doit être entre 4 et 10 ans.");
      }
  
      child.dateOfBirth = birthDate;
    }
  
    if (dto.name) child.name = dto.name;
    if (dto.avatar) child.avatar = dto.avatar;
  
    return child.save();
  }

  async findOneById(childId: string, parentId: string) {
    const child = await this.childModel.findOne({ _id: childId, parent: parentId });
    if (!child) {
      throw new BadRequestException("Enfant non trouvé ou accès interdit.");
    }
    return child;
  }
  

  async delete(childId: string, parentId: string) {
    const child = await this.childModel.findOne({ _id: childId, parent: parentId });
    if (!child) {
      throw new BadRequestException("Enfant non trouvé ou accès interdit.");
    }
  
    // Supprimer le document enfant
    await this.childModel.deleteOne({ _id: childId });
  
    // Retirer l'ID de l'enfant du tableau du parent
    await this.userModel.updateOne(
      { _id: parentId },
      { $pull: { children: childId } },
    );
  
    return { message: 'Profil enfant supprimé avec succès.' };
  }
}