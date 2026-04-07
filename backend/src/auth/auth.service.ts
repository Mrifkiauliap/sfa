import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

// ─── Tipe internal ────────────────────────────────────────────────────────────
export interface TokenPair {
  access_token: string;
  refresh_token: string;
}

const USER_SELECT = {
  id: true,
  username: true,
  fullname: true,
  semester: true,
  major: true,
  monthlyAllowance: true,
  residenceType: true,
  createdAt: true,
} as const;

// ─── Service ──────────────────────────────────────────────────────────────────
@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  // ── Register ────────────────────────────────────────────────────────────────
  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });

    if (existing) {
      throw new ConflictException('Username sudah digunakan');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        username: dto.username,
        fullname: dto.fullname,
        password: hashedPassword,
        semester: dto.semester,
        major: dto.major,
        monthlyAllowance: dto.monthlyAllowance,
        residenceType: dto.residenceType,
      },
      select: USER_SELECT,
    });

    const tokens = await this.generateTokens(user.id, user.username);

    return {
      message: 'Registrasi berhasil',
      data: { user, ...tokens },
    };
  }

  // ── Login ───────────────────────────────────────────────────────────────────
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });

    if (!user) {
      throw new UnauthorizedException('Username atau password salah');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Username atau password salah');
    }

    const { password: _pw, ...safeUser } = user;
    const tokens = await this.generateTokens(user.id, user.username);

    return {
      message: 'Login berhasil',
      data: { user: safeUser, ...tokens },
    };
  }

  // ── Refresh Token ───────────────────────────────────────────────────────────
  async refreshToken(userId: string, username: string) {
    const tokens = await this.generateTokens(userId, username);
    return {
      message: 'Token berhasil diperbarui',
      data: tokens,
    };
  }

  // ── Private: Generate Token Pair ────────────────────────────────────────────
  private async generateTokens(
    userId: string,
    username: string,
  ): Promise<TokenPair> {
    const payload = { sub: userId, username };

    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow('JWT_TOKEN'),
        expiresIn: this.configService.get('JWT_EXPIRED_TOKEN', '60m'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow('JWT_REFRESH_TOKEN'),
        expiresIn: this.configService.get('JWT_EXPIRED_REFRESH_TOKEN', '7d'),
      }),
    ]);

    return { access_token, refresh_token };
  }
}
