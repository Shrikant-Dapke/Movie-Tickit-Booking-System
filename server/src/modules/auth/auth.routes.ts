import { Router } from 'express';
import { User } from '../../models/User.js';
import { authenticate } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler, badRequest, conflict, ok, unauthorized } from '../../lib/http.js';
import { comparePassword, hashPassword } from '../../lib/password.js';
import { signToken } from '../../lib/jwt.js';
import { loginSchema, profileSchema, registerSchema } from '../../lib/validators.js';

export const authRouter = Router();

const authResponse = (user: InstanceType<typeof User>) => ({
  token: signToken({ sub: String(user._id), role: user.role as 'customer' | 'admin', name: user.name }),
  user: user.toJSON(),
});

authRouter.post(
  '/register',
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;
    const exists = await User.exists({ email });
    if (exists) throw conflict('An account with this email already exists');

    const user = await User.create({ name, email, passwordHash: await hashPassword(password), role: 'customer' });
    ok(res, authResponse(user), 'Welcome to CineBook', 201);
  }),
);

authRouter.post(
  '/login',
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await comparePassword(password, user.passwordHash))) {
      throw unauthorized('Invalid email or password');
    }
    ok(res, authResponse(user), `Welcome back, ${user.name}`);
  }),
);

authRouter.post('/logout', authenticate, (_req, res) => ok(res, { message: 'Signed out' }, 'You have been signed out'));

authRouter.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user!.sub);
    if (!user) throw unauthorized('Account not found');
    ok(res, user.toJSON(), 'Current session');
  }),
);

authRouter.patch(
  '/me',
  authenticate,
  validate(profileSchema),
  asyncHandler(async (req, res) => {
    const user = await User.findByIdAndUpdate(req.user!.sub, req.body, { new: true, runValidators: true });
    if (!user) throw badRequest('Account not found');
    ok(res, user.toJSON(), 'Profile updated');
  }),
);
