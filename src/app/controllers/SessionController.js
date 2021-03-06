import jwt from 'jsonwebtoken';
import * as Yup from 'yup';

import User from '../models/User';
import File from '../models/File';
import authConfig from '../../config/auth';

class SessionController {
  async store(req, res) {
    const schemaValidation = Yup.object().shape({
      email: Yup.string().email().required(),
      password: Yup.string().required(),
    });

    if (!(await schemaValidation.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { email, password } = req.body;
    const user = await User.findOne({
      where: { email },
      include: {
        model: File,
        as: 'avatar',
        attributes: ['id', 'name', 'path', 'url'],
      },
    });

    if (!user) {
      return res.status(400).json({ error: 'User does not exists.' });
    }

    if (!(await user.checkPassword(password))) {
      return res.status(400).json({ error: 'Incorrect password.' });
    }

    const { id, name, provider, avatar } = user;

    return res.json({
      user: {
        id,
        name,
        email,
        provider,
        avatar,
      },
      // payload, segredo, e tempo de expiração
      token: jwt.sign({ id }, authConfig.secret, {
        expiresIn: authConfig.expiresIn,
      }),
    });
  }
}

export default new SessionController();
