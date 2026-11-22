import { Router } from 'express';
import { z } from 'zod';
import { Payment } from '../../models/Payment.js';
import { authenticate } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler, forbidden, notFound, ok } from '../../lib/http.js';
import { objectId } from '../../lib/validators.js';

export const paymentsRouter = Router();

paymentsRouter.get(
  '/:id',
  authenticate,
  validate(z.object({ id: objectId }), 'params'),
  asyncHandler(async (req, res) => {
    const payment = await Payment.findById(req.params.id);
    if (!payment) throw notFound('Payment not found');
    if (req.user!.role !== 'admin' && String(payment.user) !== req.user!.sub) throw forbidden();
    ok(res, payment);
  }),
);
