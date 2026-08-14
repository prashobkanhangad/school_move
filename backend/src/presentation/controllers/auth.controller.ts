import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../../application/services/auth.service';
import { sendSuccess } from '../../utils/response';
import { AuthRequest } from '../middlewares/auth.middleware';

const authService = new AuthService();

export class AuthController {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body.email, req.body.password);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const tokens = await authService.refresh(req.body.refreshToken);
      sendSuccess(res, tokens);
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      await authService.logout(req.body.refreshToken);
      sendSuccess(res, null, 200, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  }

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await authService.getMe((req as AuthRequest).user.id);
      sendSuccess(res, user);
    } catch (error) {
      next(error);
    }
  }

  async registerDeviceToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { fcmToken, platform } = req.body;
      const token = await authService.registerDeviceToken(
        (req as AuthRequest).user.id,
        fcmToken,
        platform
      );
      sendSuccess(res, { id: token.id, platform: token.platform }, 201, 'Device token registered');
    } catch (error) {
      next(error);
    }
  }

  async removeDeviceToken(req: Request, res: Response, next: NextFunction) {
    try {
      await authService.removeDeviceToken(req.body.fcmToken);
      sendSuccess(res, null, 200, 'Device token removed');
    } catch (error) {
      next(error);
    }
  }
}
